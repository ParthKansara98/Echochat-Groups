import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_CHAT } from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faPaperPlane, faSmile, faUsers, 
  faCircle, faInfoCircle, faSearch, faTimes,
  faSun, faMoon, faCheckCircle, faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import Picker from 'emoji-picker-react';
import './Chats.css';

const Chats = () => {
  const [session, setSession] = useState(null);
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  // Initialize session from localStorage
  useEffect(() => {
    const storedSession = JSON.parse(localStorage.getItem('userSession'));
    if (storedSession) {
      setSession(storedSession);
    } else {
      navigate('/'); // Redirect if no session exists
    }
  }, [navigate]);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  
  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typing, setTyping] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [theme, setTheme] = useState(currentTheme);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);
  
  // Apply theme from localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);
  
  // Handle scroll events
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // If user has scrolled up significantly
    if (scrollHeight - scrollTop - clientHeight > 100) {
      setHasScrolledUp(true);
    } else {
      setHasScrolledUp(false);
    }
  };
  
  // Setup scroll event listener
  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleScroll);
      return () => messagesContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);
  
  const scrollToBottom = (instant = false) => {
    if (messagesEndRef.current && !hasScrolledUp) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: instant ? 'auto' : 'smooth',
        block: 'end'
      });
      setFirstLoad(false);
    }
  };

  // Fetch messages from the server
  const fetchMessages = async () => {
    if (!session || !groupId) {
      return; // Will be handled by useEffect redirect if session is null
    }
    
    // Validate that the user is accessing their correct group
    if (session.groupid !== groupId) {
      console.error("Session group ID and URL group ID don't match");
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_CHAT}/fetch-group-messages/${groupId}`);
      
      // Process messages into a flat, sortable array
      const messagesArray = Object.entries(response.data.messages || {}).flatMap(([sender, texts]) =>
        texts.map(msg => ({
          ...msg,
          sender,
          isCurrentUser: sender === session.username,
          id: `${sender}-${msg.timestamp}` // Create a unique ID for each message
        }))
      );
      
      // Sort by timestamp
      messagesArray.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      setMessages(messagesArray);
      
      // Clear any existing search
      setSearchTerm("");
      setSearchResults([]);
      setSearchMode(false);
      
      // Get unique senders as online users
      const uniqueSenders = [...new Set(messagesArray.map(msg => msg.sender))];
      setOnlineUsers(uniqueSenders); 
      
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (err.response) {
        setError(err.response.data.error || 'Failed to load messages');
      } else {
        setError('Connection error. Please check your network.');
      }
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100); // Ensure DOM is updated
    }
  };

  useEffect(() => {
    if (session && groupId) {
      fetchMessages();
      
      // Set up periodic refresh (every 30 seconds)
      const refreshInterval = setInterval(fetchMessages, 30000);
      return () => clearInterval(refreshInterval);
    }
  }, [groupId, session]);
  
  // Effect for auto-scrolling when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledUp) {
      scrollToBottom();
    }
  }, [messages, hasScrolledUp]);

  // User actions
  const handleLogout = () => {
    localStorage.removeItem('userSession');
    navigate('/');
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    
    // Simulate typing indicator
    if (!typing) {
      setTyping(true);
      setTimeout(() => setTyping(false), 2000); // Stop typing indicator after 2 seconds
    }
  };
  
  const handleEmojiClick = (emojiObject) => {
    setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false);
    messageInputRef.current?.focus();
  };
  
  const toggleEmojiPicker = () => {
    setShowEmojiPicker(prev => !prev);
  };
  
  const toggleGroupInfo = () => {
    setShowGroupInfo(prev => !prev);
    // Close search if open
    if (searchMode) {
      setSearchMode(false);
    }
  };
  
  // Toggle search functionality
  const toggleSearch = () => {
    setSearchMode(prev => !prev);
    // Close group info if open
    if (showGroupInfo) {
      setShowGroupInfo(false);
    }
    // Reset search when closing
    if (searchMode) {
      setSearchTerm("");
      setSearchResults([]);
    } else {
      // Focus search input when opening
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Search through messages
    const results = messages.filter(msg => 
      msg.text.toLowerCase().includes(term.toLowerCase()) ||
      msg.sender.toLowerCase().includes(term.toLowerCase())
    );
    
    setSearchResults(results);
  };
  
  // Scroll to a specific message (for search results)
  const scrollToMessage = (messageId) => {
    const element = document.getElementById(messageId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlighted');
      setTimeout(() => {
        element.classList.remove('highlighted');
      }, 2000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Create message object
    const message = {
      sender: session.username,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      isCurrentUser: true, // Always true for new messages from the current user
      status: 'sending' // Add a status for UI feedback
    };

    // Optimistically add message to UI
    setMessages(prevMessages => [...prevMessages, message]);
    setNewMessage("");
    scrollToBottom();
    
    try {
      // Send message to server
      await axios.post(`${API_CHAT}/send-message/${groupId}`, { message: {
        sender: message.sender,
        text: message.text,
        timestamp: message.timestamp
      }});
      
      // Update message status to 'sent'
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          (msg === message ? { ...msg, status: 'sent' } : msg)
        )
      );
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Update message status to 'failed'
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          (msg === message ? { ...msg, status: 'failed' } : msg)
        )
      );
      
      // Show error notification
      if (err.response) {
        setError(err.response.data.error || 'Failed to send message');
      } else {
        setError('Connection error. Message not sent.');
      }
    }
  };

  // Helper functions
  const formatDate = (date) => {
    const now = new Date();
    const msgDate = new Date(date);

    now.setHours(0, 0, 0, 0);
    msgDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return msgDate.toLocaleDateString('en-US', options);
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Find consecutive messages from the same sender
  const shouldShowSender = (message, index, messages) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    return message.sender !== prevMessage.sender;
  };
  
  const shouldShowAvatar = (message, index, messages) => {
    if (index === messages.length - 1) return true;
    if (messages[index + 1].sender !== message.sender) return true;
    return false;
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const dateHeader = formatDate(msg.timestamp);
    if (!acc[dateHeader]) {
      acc[dateHeader] = [];
    }
    acc[dateHeader].push(msg);
    return acc;
  }, {});
  
  // Get user's first initial for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };
  
  // Generate a unique color for each user based on their name
  const getUserColor = (name) => {
    if (!name) return 'var(--color-primary)';
    
    // Get a number from the username for consistent color
    const hash = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // Array of color variables from our theme
    const colors = [
      'var(--color-primary)',
      'var(--color-secondary)',
      'var(--color-accent)',
      'var(--color-success)',
      'var(--color-info)',
      'var(--color-warning)'
    ];
    
    return colors[hash % colors.length];
  };
  
  // Loading state
  if (loading && messages.length === 0) {
    return (
      <div className="chat-loading">
        <div className="loader-container">
          <div className="chat-loader"></div>
          <p>Loading messages...</p>
        </div>
        <button className="styled-button back-button" onClick={() => navigate('/')}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Groups
        </button>
      </div>
    );
  }
  
  // Error state
  if (error && messages.length === 0) {
    return (
      <div className="chat-error">
        <div className="error-container">
          <div className="error-icon">!</div>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
        <div className="error-actions">
          <button className="styled-button retry-button" onClick={fetchMessages}>
            Try Again
          </button>
          <button className="styled-button back-button" onClick={() => navigate('/')}>
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="header-left">
          <button 
            onClick={() => {
              console.log('Attempting to navigate home');
              try {
                // Remove any existing session data
                localStorage.removeItem('userSession');
                
                // Perform navigation
                navigate('/', { 
                  state: { 
                    from: 'chat', 
                    groupId: groupId 
                  } 
                });
              } catch (error) {
                console.error('Navigation error:', error);
                // Fallback navigation method
                window.location.href = '/';
              }
            }} 
            className="back-link"
            aria-label="Back to groups"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <div className="group-info" onClick={toggleGroupInfo}>
            <h2>{groupId}</h2>
            <div className="online-indicator">
              {onlineUsers.length > 0 ? (
                <>
                  <FontAwesomeIcon icon={faCircle} className="online-dot" />
                  <span>{onlineUsers.length} {onlineUsers.length === 1 ? 'member' : 'members'} online</span>
                </>
              ) : (
                <span className="offline">No users online</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className={`icon-button ${searchMode ? 'active' : ''}`} 
            aria-label="Search messages" 
            onClick={toggleSearch}
          >
            <FontAwesomeIcon icon={searchMode ? faTimes : faSearch} />
          </button>
          <button 
            className={`icon-button ${showGroupInfo ? 'active' : ''}`} 
            aria-label="Group information" 
            onClick={toggleGroupInfo}
          >
            <FontAwesomeIcon icon={faInfoCircle} />
          </button>
        </div>
      </div>
      
      {/* Search overlay */}
      {searchMode && (
        <div className="search-overlay">
          <div className="search-container">
            <div className="search-input-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search in conversation..."
                value={searchTerm}
                onChange={handleSearch}
                ref={searchInputRef}
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm("")}>×</button>
              )}
            </div>
            
            <div className="search-results">
              {searchResults.length > 0 ? (
                <>
                  <div className="search-count">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</div>
                  {searchResults.map(result => (
                    <div 
                      key={result.id} 
                      className="search-result-item" 
                      onClick={() => {
                        scrollToMessage(result.id);
                        setSearchMode(false);
                      }}
                    >
                      <div className="result-sender">{result.sender}</div>
                      <div className="result-preview">
                        {result.text.length > 60 ? `${result.text.substring(0, 60)}...` : result.text}
                      </div>
                      <div className="result-time">{formatTime(result.timestamp)}</div>
                    </div>
                  ))}
                </>
              ) : searchTerm ? (
                <div className="no-results">No messages matching "{searchTerm}"</div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      
      {/* Group Info Sidebar - conditionally shown */}
      {showGroupInfo && (
        <div className="group-info-sidebar">
          <div className="sidebar-header">
            <h3>Group Information</h3>
            <div className="sidebar-header-actions">
              <button 
                className="sidebar-theme-toggle" 
                onClick={toggleTheme} 
                aria-label="Toggle theme"
              >
                <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
              </button>
              <button className="close-button" onClick={toggleGroupInfo} aria-label="Close group info">×</button>
            </div>
          </div>
          
          <div className="group-avatar">
            <div className="group-avatar-placeholder">
              <FontAwesomeIcon icon={faUsers} />
            </div>
          </div>
          
          <h2>{groupId}</h2>
          <div className="member-count">{onlineUsers.length} member{onlineUsers.length !== 1 ? 's' : ''}</div>
          
          <div className="section-title">Members</div>
          <div className="members-list">
            {onlineUsers.map((user, index) => {
              const isCurrentUser = user === session?.username;
              return (
                <div key={index} className={`member-item ${isCurrentUser ? 'you' : ''}`}>
                  <div 
                    className="user-avatar" 
                    style={{ backgroundColor: getUserColor(user) }}
                  >
                    {getInitial(user)}
                  </div>
                  <div className="member-details">
                    <div className="member-name">
                      {user} {isCurrentUser && <span className="you-label">(You)</span>}
                    </div>
                    <div className="member-status">
                      <FontAwesomeIcon icon={faCircle} className="online-dot" />
                      Active now
                    </div>
                  </div>
                </div>
              );
            })}
            {session && (
              <div className="member-item you">
                <div 
                  className="user-avatar" 
                  style={{ backgroundColor: getUserColor(session.username) }}
                >
                  {getInitial(session.username)}
                </div>
                <div className="member-details">
                  <div className="member-name">{session.username} (You)</div>
                  <div className="member-status">
                    <FontAwesomeIcon icon={faCircle} className="online-dot" />
                    Online
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="info-actions">
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
      
      {/* Main Chat Area */}
      <div className="messages-container" ref={messagesContainerRef}>
        {loading && messages.length > 0 && (
          <div className="loading-more">
            <div className="chat-loader small"></div>
            <span>Loading messages...</span>
          </div>
        )}
        
        <div className="messages-list">
          {Object.keys(groupedMessages).map(date => (
            <div key={date} className="messages-group">
              <div className="date-header">{date}</div>
              
              {groupedMessages[date].map((msg, index, array) => {
                const isFirstInSeries = shouldShowSender(msg, index, array);
                const isLastInSeries = shouldShowAvatar(msg, index, array);
                return (
                  <div 
                    id={msg.id}
                    key={index} 
                    className={`message-wrapper ${msg.isCurrentUser ? 'outgoing' : 'incoming'} ${isFirstInSeries ? 'first-in-series' : ''} ${isLastInSeries ? 'last-in-series' : ''}`}
                  >
                    {!msg.isCurrentUser && isLastInSeries && (
                      <div 
                        className="avatar" 
                        style={{ backgroundColor: getUserColor(msg.sender) }}
                      >
                        {getInitial(msg.sender)}
                      </div>
                    )}
                    
                    <div className="message-bubble-container">
                      {isFirstInSeries && !msg.isCurrentUser && (
                        <div className="message-sender">{msg.sender}</div>
                      )}
                      
                      <div className="message-bubble">
                        <div className="message-text">{msg.text}</div>
                        <div className="message-meta">
                          <span className="message-time">{formatTime(msg.timestamp)}</span>
                          {msg.isCurrentUser && (
                            <span className={`message-status ${msg.status || 'sent'}`}>
                              {msg.status === 'sending' ? '•••' : 
                               msg.status === 'failed' ? '!' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          
          {typing && (
            <div className="typing-indicator">
              <div className="typing-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
              <div className="typing-text">Someone is typing...</div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="scroll-anchor" />
          
          {hasScrolledUp && (
            <button 
              className="scroll-to-bottom-btn" 
              onClick={() => scrollToBottom(true)}
              aria-label="Scroll to bottom"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="scroll-icon" />
              <span>New messages</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Message Input Area */}
      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-form">
          <div className="message-input-wrapper">
            <input
              type="text"
              className="message-input"
              value={newMessage}
              onChange={handleMessageChange}
              placeholder="Type a message..."
              ref={messageInputRef}
            />
            <button 
              type="button" 
              className="emoji-button" 
              onClick={toggleEmojiPicker}
              aria-label="Add emoji"
            >
              <FontAwesomeIcon icon={faSmile} />
            </button>
            
            {showEmojiPicker && (
              <div className="emoji-picker-container">
                <div className="emoji-picker-header">
                  <span>Emojis</span>
                  <button 
                    type="button" 
                    className="close-emoji" 
                    onClick={() => setShowEmojiPicker(false)}
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <Picker onEmojiClick={handleEmojiClick} />
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="send-button" 
            disabled={!newMessage.trim()}
            aria-label="Send message"
          >
            <FontAwesomeIcon icon={faPaperPlane} />
            <span className="send-text">Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chats;
