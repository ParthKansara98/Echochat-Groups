import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useSnackbar } from "notistack";
import OldMemberForm from './OldMemberForm';
import NewMemberForm from './NewMemberForm';
import ThemeToggle from './ThemeToggle';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEdit,
    faSearch,
    faTrash,
    faPlus,
    faTimes,
    faUserPlus,
    faUsers,
    faLock,
    faGlobe,
    faList,
    faThList,
    faHashtag,
    faFilter,
    faMagnifyingGlass,
    faSun,
    faMoon
} from "@fortawesome/free-solid-svg-icons";
import { CircularProgress, Box } from '@mui/material';
import { API_GROUP } from "../api";
import "../styles/buttons.css";
import "./Home.css";

function Home() {
    const [groups, setGroups] = useState([]);
    const [filteredGroups, setFilteredGroups] = useState([]);
    const [searchParams, setSearchParams] = useState({
        groupName: "",
        groupType: "",
        groupTag: "",
    });
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isAdminPopupOpen, setIsAdminPopupOpen] = useState(false);
    const [showCreateGroupTooltip, setShowCreateGroupTooltip] = useState(false);
    const [passkey, setPasskey] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [isOldMember, setIsOldMember] = useState(false);
    const [adminUsername, setAdminUsername] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [adminGroupId, setAdminGroupId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('card'); // Options: 'card', 'list', 'detail'
    const [currentTheme, setCurrentTheme] = useState(() => {
        return document.documentElement.getAttribute('data-theme') || 'light';
    });
    const navigate = useNavigate();
    const location = useLocation();
    const { enqueueSnackbar } = useSnackbar();

    // Fetch groups from the backend
    useEffect(() => {
        const fetchGroups = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_GROUP}/fetch-groups`);
                setGroups(response.data);
                setFilteredGroups(response.data);
            } catch (error) {
                console.error("Fetch error:", error);
                enqueueSnackbar("Failed to fetch groups", { variant: "error" });
            } finally {
                setLoading(false);
            }
        };

        fetchGroups();
    }, [enqueueSnackbar]);

    // Check existing session on mount
    useEffect(() => {
        const session = JSON.parse(localStorage.getItem("userSession"));
        const locationState = location.state;

        console.log('Home page mount - Session:', session);
        console.log('Location state:', locationState);

        // Clear any lingering location state
        if (location.state) {
            window.history.replaceState({}, document.title);
        }

        if (session && session.groupid) {
            navigate(`/chat/${session.groupid}`);
        }
    }, [navigate, location]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setSearchParams((prevParams) => ({
            ...prevParams,
            [name]: value,
        }));
    };

    const handleSearch = () => {
        const { groupName, groupType, groupTag } = searchParams;
        const filtered = groups.filter((group) => {
            const matchesName = groupName === "" || group.groupName.toLowerCase().includes(groupName.toLowerCase());
            const matchesType = groupType === "" || String(group.type) === groupType;
            const matchesTag = groupTag === "" || (group.tags && group.tags.some((tag) => tag.toLowerCase().includes(groupTag.toLowerCase())));
            return matchesName && matchesType && matchesTag;
        });
        setFilteredGroups(filtered);
    };

    // Fixed handleJoinClick function to properly set state before opening popup
    const handleJoinClick = (group, isOld) => {
        console.log("Join button clicked!", group, isOld);
        // First set all the required state
        setSelectedGroup(group);
        setIsOldMember(isOld);
        setUsername("");
        setPassword("");
        setConfirmPassword("");
        setPasskey("");

        // Set popup state immediately
        setIsPopupOpen(true);

        // Log the state to confirm values were set
        console.log("Popup state set, isPopupOpen:", true);
    };

    const joinGroup = async () => {
        if (!selectedGroup) {
            enqueueSnackbar("Error selecting the group. Please try again.", { variant: "error" });
            return;
        }

        // Validate input for old member
        if (isOldMember) {
            if (!username || !password) {
                enqueueSnackbar("Please enter valid information.", { variant: "warning" });
                return;
            }
            if (selectedGroup.type === 1 && selectedGroup.passkey !== passkey) {
                enqueueSnackbar("Incorrect passkey! Please try again.", { variant: "error" });
                return;
            }
        } else {
            // Validate input for new member
            if (!username || !password || password !== confirmPassword) {
                enqueueSnackbar("Passwords do not match or missing fields.", { variant: "warning" });
                return;
            }
        }

        const memberData = {
            groupid: selectedGroup.groupid,
            username: username,
            password: password,
            passkey: selectedGroup.type === 1 ? passkey : null,
            isOldMember: isOldMember,
        };

        try {
            const response = await axios.post(isOldMember ? `${API_GROUP}/join-group` : `${API_GROUP}/add-member`, memberData);

            // Store session data in localStorage
            localStorage.setItem("userSession", JSON.stringify({
                groupid: selectedGroup.groupid,
                username: username,
                token: response.data.token, // assuming you get a token from the backend
            }));

            enqueueSnackbar(response.data.message, { variant: "success" });
            // Close popup before redirecting
            setIsPopupOpen(false);
            // Navigate to chat page using session management
            window.location.href = `/chat/${selectedGroup.groupid}`;
        } catch (error) {
            const errorMessage = error.response?.data?.error || "Failed to join the group.";
            enqueueSnackbar(errorMessage, { variant: "error" });
        }
    };

    // Fixed openAdminPopup function
    const openAdminPopup = (groupid) => {
        // Reset admin credentials first
        setAdminUsername("");
        setAdminPassword("");
        setAdminGroupId(groupid);

        // Open popup with a small delay to ensure state is updated
        setTimeout(() => {
            setIsAdminPopupOpen(true);
        }, 10);
    };

    // Handle admin login
    const handleAdminLogin = async () => {
        console.log("Admin Login Attempt Started");
        console.log("Admin Username:", adminUsername);
        console.log("Admin Group ID:", adminGroupId);

        if (!adminUsername || !adminPassword) {
            enqueueSnackbar("Please enter admin username and password.", { variant: "warning" });
            return;
        }

        try {
            console.log("Sending admin login request...");
            const response = await axios.post(`${API_GROUP}/admin-login`, {
                adminUsername: adminUsername,
                adminPassword: adminPassword,
                groupid: adminGroupId
            });

            console.log("Admin Login Response:", response.data);

            if (response.data.success) {
                enqueueSnackbar(response.data.message, { variant: "success" });

                // Store session with a timestamp
                const sessionData = {
                    groupid: adminGroupId,
                    adminUsername: adminUsername,
                    timestamp: Date.now(),
                };
                localStorage.setItem("adminSession", JSON.stringify(sessionData));

                // Close popup before redirecting
                setIsAdminPopupOpen(false);
                
                // Add a slight delay before navigation to ensure state updates
                setTimeout(() => {
                    console.log("Navigating to admin panel");
                    navigate(`/admin/${adminGroupId}`);
                }, 100);
            } else {
                console.error("Admin login failed:", response.data);
                enqueueSnackbar(response.data.message || "Admin login failed.", { variant: "error" });
            }
        } catch (error) {
            console.error("Admin Login Error:", error);
            const errorMessage = error.response?.data?.message || "Admin login failed. Please try again.";
            enqueueSnackbar(errorMessage, { variant: "error" });
        }
    };

    // Function to close popup and clean up state
    const handleClosePopup = () => {
        console.log("Closing popup");
        setIsPopupOpen(false);

        // Small delay before resetting state to avoid UI flicker
        setTimeout(() => {
            setSelectedGroup(null);
            setUsername("");
            setPassword("");
            setConfirmPassword("");
            setPasskey("");
            console.log("Popup state cleaned up");
        }, 300);
    };

    // Function to close admin popup and clean up state
    const handleCloseAdminPopup = () => {
        setIsAdminPopupOpen(false);
        // Small delay before resetting state to avoid UI flicker
        setTimeout(() => {
            setAdminGroupId(null);
            setAdminUsername("");
            setAdminPassword("");
        }, 300);
    };

    const toggleTheme = () => {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        setCurrentTheme(newTheme);
    };

    return (
        <>
            <div className="app">
                <div className="app-header">
                    <h1 className="app-title">Echochat Groups</h1>
                    <div className="header-actions">
                        <ThemeToggle currentTheme={currentTheme} toggleTheme={toggleTheme} />
                    </div>
                </div>

                {/* Search and filter section */}
                <div className="search-form">
                    <div className="search-form-title">
                        <span>Find Your Perfect Group</span>
                        {filteredGroups.length > 0 && (searchParams.groupName || searchParams.groupType || searchParams.groupTag) ? (
                            <button
                                className="clear-filters-btn"
                                onClick={() => {
                                    setSearchParams({ groupName: "", groupType: "", groupTag: "" });
                                    setFilteredGroups(groups);
                                }}
                                aria-label="Clear all search filters"
                            >
                                <FontAwesomeIcon icon={faTrash} /> 
                                <span>Clear Filters</span>
                            </button>
                        ) : null}
                    </div>

                    <div className="search-input-container">
                        <FontAwesomeIcon icon={faSearch} className="search-icon" />
                        <input
                            type="text"
                            name="groupName"
                            placeholder="Search by group name"
                            value={searchParams.groupName}
                            onChange={handleInputChange}
                            aria-label="Search groups by name"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSearch();
                            }}
                        />
                    </div>

                    <div className="filter-controls">
                        <div className="filter-container">
                            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
                            <select
                                name="groupType"
                                value={searchParams.groupType}
                                onChange={handleInputChange}
                                aria-label="Filter groups by type"
                            >
                                <option value="">All Types</option>
                                <option value="0">Public</option>
                                <option value="1">Private</option>
                            </select>
                        </div>

                        <div className="search-input-container tag-input-container">
                            <FontAwesomeIcon icon={faHashtag} className="search-icon" />
                            <input
                                type="text"
                                name="groupTag"
                                placeholder="Filter by tag"
                                value={searchParams.groupTag}
                                onChange={handleInputChange}
                                aria-label="Search groups by tag"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>

                        <div className="search-clear-buttons">
                            <button 
                                className="search-button" 
                                onClick={handleSearch}
                                aria-label="Search groups"
                            >
                                <FontAwesomeIcon icon={faSearch} /> 
                                <span>Explore Groups</span>
                            </button>

                            <button
                                className="clear-button"
                                onClick={() => {
                                    setSearchParams({
                                        groupName: "",
                                        groupType: "",
                                        groupTag: "",
                                    });
                                    setFilteredGroups(groups);
                                }}
                                aria-label="Reset search filters"
                            >
                                <FontAwesomeIcon icon={faTimes} /> 
                                <span>Reset Search</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Display loader when fetching data */}
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                        <CircularProgress />
                    </Box>
                ) : (
                    <>
                        <div className="search-results-count">
                            <span>
                                Found {filteredGroups.length} group{filteredGroups.length !== 1 ? 's' : ''}
                            </span>

                            <div className="view-toggle-container">
                                <div className="view-mode-label">View:</div>
                                <div className="view-toggle-buttons">
                                    <button
                                        className={`view-toggle-btn ${viewMode === 'card' ? 'active' : ''}`}
                                        onClick={() => setViewMode('card')}
                                        aria-label="Card view"
                                        title="Card view"
                                    >
                                        <FontAwesomeIcon icon={faUsers} />
                                    </button>
                                    <button
                                        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                        onClick={() => setViewMode('list')}
                                        aria-label="List view"
                                        title="List view"
                                    >
                                        <FontAwesomeIcon icon={faList} />
                                    </button>
                                    <button
                                        className={`view-toggle-btn ${viewMode === 'detail' ? 'active' : ''}`}
                                        onClick={() => setViewMode('detail')}
                                        aria-label="Detail view"
                                        title="Detail view"
                                    >
                                        <FontAwesomeIcon icon={faThList} />
                                    </button>
                                </div>
                            </div>
                        </div>


                        <div className={`group-container ${viewMode}-view`}>
                            {filteredGroups.length > 0 ? (
                                filteredGroups.map((group, index) => (
                                    <div 
                                        className={`group-item ${viewMode === 'card' ? 'group-card' : ''} ${viewMode === 'list' ? 'group-list' : ''} ${viewMode === 'detail' ? 'group-detail' : ''}`} 
                                        key={group._id || index}
                                        style={viewMode === 'card' ? { '--index': index } : {}}
                                    >
                                        {/* Card View Structure */}
                                        {viewMode === 'card' && (
                                            <>
                                                <div className="group-header">
                                                    <h2 className="group-name">{group.groupName}</h2>
                                                    <div className="group-type-badge">
                                                        {group.type === 1 ? (
                                                            <span className="badge badge-private" title="Private Group">
                                                                <FontAwesomeIcon icon={faLock} /> Private
                                                            </span>
                                                        ) : (
                                                            <span className="badge badge-public" title="Public Group">
                                                                <FontAwesomeIcon icon={faGlobe} /> Public
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="admin-login-wrapper">
                                                        <button
                                                            className="admin-login-button"
                                                            onClick={() => openAdminPopup(group.groupid)}
                                                            title="Admin Access"
                                                            aria-label="Open Admin Login for Group"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                            <span className="admin-login-label">Admin Login</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="group-content">
                                                    <p className="group-description">{group.desc}</p>
                                                    <div className="group-meta">
                                                        <p className="group-members">
                                                            <strong>{Object.keys(group.members).length}</strong> members
                                                        </p>
                                                        {group.tags && group.tags.length > 0 && (
                                                            <div className="group-tags">
                                                                {group.tags.map((tag, i) => (
                                                                    <span className="tag" key={i}>#{tag}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="group-card-actions">
                                                        <button
                                                            className="btn btn-secondary"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleJoinClick(group, true);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faUsers} /> Existing Member
                                                        </button>
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleJoinClick(group, false);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faUserPlus} /> New Member
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* List View Structure */}
                                        {viewMode === 'list' && (
                                            <>
                                                <div className="group-header">
                                                    <h2 className="group-name">{group.groupName}</h2>
                                                    <div className="group-type-badge">
                                                        {group.type === 1 ? (
                                                            <span className="badge badge-private">
                                                                <FontAwesomeIcon icon={faLock} /> Private
                                                            </span>
                                                        ) : (
                                                            <span className="badge badge-public">
                                                                <FontAwesomeIcon icon={faGlobe} /> Public
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="admin-login-wrapper">
                                                        <button
                                                            className="admin-login-button"
                                                            onClick={() => openAdminPopup(group.groupid)}
                                                            title="Admin Access"
                                                            aria-label="Open Admin Login for Group"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                            <span className="admin-login-label">Admin Login</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="group-content">
                                                    <p className="group-description">{group.desc}</p>
                                                    <div className="group-details">
                                                        <div className="group-members-section">
                                                            <h3>Members</h3>
                                                            <p className="group-members">
                                                                This group has <strong>{Object.keys(group.members).length}</strong> members
                                                            </p>
                                                        </div>
                                                        {group.tags && group.tags.length > 0 && (
                                                            <div className="group-tags-section">
                                                                <h3>Tags</h3>
                                                                <div className="group-tags">
                                                                    {group.tags.map((tag, i) => (
                                                                        <span className="tag" key={i}>#{tag}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="group-actions">
                                                        <button
                                                            className="btn btn-secondary"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleJoinClick(group, true);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faUsers} /> Join as Existing Member
                                                        </button>
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleJoinClick(group, false);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faUserPlus} /> Join as New Member
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* Detail View Structure */}
                                        {viewMode === 'detail' && (
                                            <>
                                                <div className="group-header detail-header">
                                                    <div className="detail-header-left">
                                                        <h2 className="group-name">{group.groupName}</h2>
                                                        <div className="group-meta-inline">
                                                            <span className="group-members-count">
                                                                <FontAwesomeIcon icon={faUsers} /> {Object.keys(group.members).length} members
                                                            </span>
                                                            <div className="group-type-badge">
                                                                {group.type === 1 ? (
                                                                    <span className="badge badge-private">
                                                                        <FontAwesomeIcon icon={faLock} /> Private
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge badge-public">
                                                                        <FontAwesomeIcon icon={faGlobe} /> Public
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="admin-login-wrapper">
                                                        <button
                                                            className="admin-login-button"
                                                            onClick={() => openAdminPopup(group.groupid)}
                                                            title="Admin Access"
                                                            aria-label="Open Admin Login for Group"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} />
                                                            <span className="admin-login-label">Admin Login</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="group-content detail-content">
                                                    <div className="detail-section">
                                                        <h3 className="detail-section-title">Description</h3>
                                                        <p className="group-description">{group.desc}</p>
                                                    </div>

                                                    {group.tags && group.tags.length > 0 && (
                                                        <div className="detail-section">
                                                            <h3 className="detail-section-title">Tags</h3>
                                                            <div className="group-tags">
                                                                {group.tags.map((tag, i) => (
                                                                    <span className="tag" key={i}>#{tag}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="detail-section">
                                                        <h3 className="detail-section-title">Membership</h3>
                                                        <div className="membership-info">
                                                            <p>This group currently has <strong>{Object.keys(group.members).length}</strong> active members.</p>
                                                            <p className="membership-type-info">
                                                                {group.type === 1 ? (
                                                                    <>This is a <strong>private group</strong> that requires a passkey to join.</>
                                                                ) : (
                                                                    <>This is a <strong>public group</strong> that anyone can join without a passkey.</>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="detail-actions">
                                                        <button
                                                            className="btn btn-secondary btn-lg"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleJoinClick(group, true);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faUsers} /> Join as Existing Member
                                                        </button>
                                                        <button
                                                            className="btn btn-primary btn-lg"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleJoinClick(group, false);
                                                            }}
                                                        >
                                                            <FontAwesomeIcon icon={faUserPlus} /> Join as New Member
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="no-results">
                                    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" padding="3rem" textAlign="center">
                                        <FontAwesomeIcon icon={faSearch} size="4x" style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem" }} />
                                        <h2 style={{ color: "var(--color-text-primary)", marginBottom: "1rem" }}>No Groups Found</h2>
                                        <p style={{ color: "var(--color-text-secondary)", marginBottom: "1.5rem" }}>No groups match your search criteria. Try adjusting your filters.</p>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setSearchParams({ groupName: "", groupType: "", groupTag: "" });
                                                setFilteredGroups(groups);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTrash} /> Clear All Filters
                                        </button>
                                    </Box>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <button
                className="btn btn-floating"
                aria-label="Add New Group"
                onClick={() => navigate("/add-group")}
                onMouseOver={() => setShowCreateGroupTooltip(true)}
                onMouseOut={() => setShowCreateGroupTooltip(false)}
            >
                <FontAwesomeIcon icon={faPlus} />
                {showCreateGroupTooltip && (
                    <span className="tooltip">Create a new group</span>
                )}
            </button>

            {/* Create Group Popup Message - Improved styling */}
            {showCreateGroupTooltip && (
                <div className="create-group-popup-message">
                    <div className="popup-message-content">
                        <div className="popup-header">
                            <h3>
                                <FontAwesomeIcon icon={faPlus} className="popup-header-icon" />
                                Create a New Group
                            </h3>
                            <button className="popup-close-btn" onClick={() => setShowCreateGroupTooltip(false)} aria-label="Close">
                            </button>
                        </div>
                        <div className="popup-body">
                            <p>Click the + button to create your own chat group. You can create public or private groups and customize your experience!</p>
                            <div className="feature-list">
                                <div className="feature-item">
                                    <FontAwesomeIcon icon={faGlobe} className="feature-icon public-icon" />
                                    <span>Create public groups anyone can join</span>
                                </div>
                                <div className="feature-item">
                                    <FontAwesomeIcon icon={faLock} className="feature-icon private-icon" />
                                    <span>Set up private groups with passkeys</span>
                                </div>
                                <div className="feature-item">
                                    <FontAwesomeIcon icon={faUsers} className="feature-icon members-icon" />
                                    <span>Invite friends and collaborate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Admin login popup */}
            {isAdminPopupOpen && (
                <div
                    className="admin-popup-overlay"
                    onClick={(e) => {
                        // Only close if the overlay itself is clicked, not its children
                        if (e.target === e.currentTarget) {
                            handleCloseAdminPopup();
                        }
                    }}
                >
                    <div className="admin-popup-content" onClick={e => e.stopPropagation()}>
                        <div className="admin-popup-header">
                            <div className="admin-popup-logo">
                                <FontAwesomeIcon icon={faLock} className="admin-icon-lock" />
                            </div>
                            <h2>Group Administration</h2>
                            <p className="admin-popup-subtitle">Secure login required</p>
                            <button
                                className="popup-close-btn"
                                onClick={handleCloseAdminPopup}
                                aria-label="Close"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        <div className="admin-popup-body">
                            <div className="admin-form-group">
                                <label htmlFor="adminUsername">Username</label>
                                <div className="admin-input-wrapper">
                                    <FontAwesomeIcon icon={faUsers} className="admin-input-icon" />
                                    <input
                                        id="adminUsername"
                                        type="text"
                                        placeholder="Admin username"
                                        value={adminUsername}
                                        onChange={(e) => setAdminUsername(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="admin-form-group">
                                <label htmlFor="adminPassword">Password</label>
                                <div className="admin-input-wrapper">
                                    <FontAwesomeIcon icon={faLock} className="admin-input-icon" />
                                    <input
                                        id="adminPassword"
                                        type="password"
                                        placeholder="Admin password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAdminLogin();
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="admin-form-actions">
                                <button className="btn btn-primary btn-admin-login" onClick={handleAdminLogin}>
                                    <FontAwesomeIcon icon={faEdit} />
                                    Authenticate
                                </button>
                            </div>

                            <div className="admin-security-info">
                                <FontAwesomeIcon icon={faLock} className="security-icon" />
                                <span>Secure connection. Admin credentials are encrypted.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Member join popup with improved event propagation handling */}
            {isPopupOpen && selectedGroup && (
                <div
                    className="popup-overlay"
                    onClick={(e) => {
                        // Only close if the overlay itself is clicked, not its children
                        if (e.target === e.currentTarget) {
                            handleClosePopup();
                        }
                    }}
                >
                    <div className="popup-content" onClick={e => e.stopPropagation()}>
                        <h2>{isOldMember ? 'Welcome Back to' : 'Join'} {selectedGroup.groupName}</h2>
                        <button
                            className="popup-close-btn"
                            onClick={handleClosePopup}
                            aria-label="Close"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                        {isOldMember ? (
                            <OldMemberForm
                                username={username}
                                password={password}
                                passkey={passkey}
                                groupType={selectedGroup.type}
                                setUsername={setUsername}
                                setPassword={setPassword}
                                setPasskey={setPasskey}
                                onSubmit={joinGroup}
                                onCancel={handleClosePopup}
                            />
                        ) : (
                            <NewMemberForm
                                username={username}
                                password={password}
                                confirmPassword={confirmPassword}
                                passkey={passkey}
                                groupType={selectedGroup.type}
                                setUsername={setUsername}
                                setPassword={setPassword}
                                setConfirmPassword={setConfirmPassword}
                                setPasskey={setPasskey}
                                onSubmit={joinGroup}
                                onCancel={handleClosePopup}
                            />
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
export default Home;