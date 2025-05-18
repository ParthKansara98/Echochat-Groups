import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import './Admin.css';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { API_GROUP } from '../api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPencilAlt, faTrash, faUsers, faEye, faEyeSlash, faSave, faTimes, faUserMinus, faSignOutAlt, faShieldAlt, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';

const MySwal = withReactContent(Swal);
const Admin = () => {
    const { groupid } = useParams();
    const { enqueueSnackbar } = useSnackbar();
    const [groupDetails, setGroupDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        groupName: '',
        desc: '',
        type: 0,
        tags: '',
        adminName: ''
    });
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Check session expiry
        const session = JSON.parse(localStorage.getItem("adminSession"));
        if (session) {
            const currentTime = Date.now();
            // 15 minutes in milliseconds
            const sessionExpiry = 15 * 60 * 1000;

            if (currentTime - session.timestamp > sessionExpiry) {
                enqueueSnackbar("Session expired. Please log in again.", { variant: "warning" });
                localStorage.removeItem("adminSession");
                navigate('/'); // Redirect to home or login page
                return;
            }
        } else {
            enqueueSnackbar("No active session. Please log in.", { variant: "warning" });
            navigate('/'); // Redirect to home or login page
            return;
        }

        const fetchGroupDetails = async () => {
            try {
                const response = await axios.get(`${API_GROUP}/groups/${groupid}`);
                if (response.status === 200) {
                    const { groupName, desc, type, tags, admin } = response.data;
                    setGroupDetails(response.data);
                    setFormData({
                        groupName,
                        desc,
                        type,
                        tags: Array.isArray(tags) ? tags.join(", ") : '',
                        adminName: admin ? admin.name : ''
                    });
                } else {
                    enqueueSnackbar("Failed to fetch group details.", { variant: "error" });
                }
            } catch (error) {
                enqueueSnackbar("Error fetching group details.", { variant: "error" });
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGroupDetails();
    }, [groupid, enqueueSnackbar, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
    };

    const handleRemoveMember = async (memberName) => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: `This will remove the member ${memberName} from the group.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, remove member!'
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.post(`${API_GROUP}/remove-member`, { groupid, name: memberName });
                if (response.status === 200) {
                    MySwal.fire(
                        'Removed!',
                        `Member ${memberName} has been removed successfully.`,
                        'success'
                    );
                    // Update the UI
                    setGroupDetails(prev => {
                        const updatedMembers = { ...prev.members };
                        delete updatedMembers[memberName];
                        return { ...prev, members: updatedMembers };
                    });
                } else {
                    enqueueSnackbar("Failed to remove member.", { variant: "error" });
                }
            } catch (error) {
                enqueueSnackbar("Error removing member.", { variant: "error" });
                console.error("Remove error:", error);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const updatedData = {
            ...formData,
            tags: formData.tags.split(",").map(tag => tag.trim()),
            passkey: formData.type === '1' ? password : null
        };

        try {
            const response = await axios.put(`${API_GROUP}/group/${groupid}`, updatedData);
            if (response.status === 200) {
                enqueueSnackbar("Group details updated successfully!", { variant: "success" });
                setGroupDetails(prev => ({ ...prev, ...updatedData }));
                setIsEditing(false);
                setPassword('');
            } else {
                enqueueSnackbar("Failed to update group details.", { variant: "error" });
            }
        } catch (error) {
            enqueueSnackbar("Error updating group details.", { variant: "error" });
            console.error("Update error:", error);
        }
    };


    const handleDeleteGroup = async () => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: "This action will permanently delete your group and all associated chats! Are you sure you want to proceed?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.delete(`${API_GROUP}/delete-group/${groupid}`);
                if (response.status === 200) {
                    MySwal.fire(
                        'Deleted!',
                        'The group has been deleted successfully.',
                        'success'
                    );
                    navigate('/'); // Redirect to main groups page
                } else {
                    enqueueSnackbar("Failed to delete group.", { variant: "error" });
                }
            } catch (error) {
                enqueueSnackbar("Error deleting group.", { variant: "error" });
                console.error("Delete error:", error);
            }
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    const handleBack = () => {
        navigate('/'); // Navigate back to home page
    };

    return (
        <div className="admin-container">
            <button type="button" className="btn btn-secondary btn-sm back-btn" onClick={handleBack}>
                <FontAwesomeIcon icon={faArrowLeft} /> Back to Home
            </button>
            
            <div className='admin-panel'>
                <div className="panel-header">
                    <h1>
                        <FontAwesomeIcon icon={faShieldAlt} className="admin-icon" />
                        Admin Panel
                    </h1>
                    <p className="header-subtitle">Manage your group and members here</p>
                </div>
                
                {loading ? (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                        <p>Loading group details...</p>
                    </div>
                ) : groupDetails ? (
                    <div className="panel-content">
                        {isEditing ? (
                            <div className="edit-form-container">
                                <div className="form-header">
                                    <h2>
                                        <FontAwesomeIcon icon={faPencilAlt} /> Edit {formData.groupName}
                                    </h2>
                                </div>
                                <form onSubmit={handleSubmit} className="group-edit-form">
                                    <div className="form-group">
                                        <label htmlFor="groupName">Group Name:</label>
                                        <input 
                                            type="text" 
                                            id="groupName" 
                                            name="groupName" 
                                            value={formData.groupName} 
                                            onChange={handleInputChange} 
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="desc">Description:</label>
                                        <textarea 
                                            id="desc" 
                                            name="desc" 
                                            value={formData.desc} 
                                            onChange={handleInputChange} 
                                            required 
                                        />
                                        <div className="char-count">{formData.desc.length} / 500 characters</div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="tags">Tags (comma separated):</label>
                                        <input 
                                            type="text" 
                                            id="tags" 
                                            name="tags" 
                                            value={formData.tags} 
                                            onChange={handleInputChange} 
                                        />
                                        <div className="helper-text">Separate tags with commas. Example: chat, technology, gaming</div>
                                    </div>
                                    <div className="form-actions">
                                        <button type="button" className="btn btn-secondary" onClick={toggleEditMode}>
                                            <FontAwesomeIcon icon={faTimes} /> Cancel
                                        </button>
                                        <button type="submit" className="btn btn-success">
                                            <FontAwesomeIcon icon={faSave} /> Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="group-details-view">
                                <div className="group-header">
                                    <div className="group-header-content">
                                        <h2>{groupDetails.groupName}</h2>
                                        <div className="group-type-badge">
                                            {groupDetails.type === 0 ? (
                                                <span className="public-badge">
                                                    <FontAwesomeIcon icon={faEye} /> Public
                                                </span>
                                            ) : (
                                                <span className="private-badge">
                                                    <FontAwesomeIcon icon={faEyeSlash} /> Private
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="group-actions">
                                        <button className="btn btn-primary" onClick={toggleEditMode}>
                                            <FontAwesomeIcon icon={faPencilAlt} /> Edit Group
                                        </button>
                                        <button className="btn btn-danger" onClick={handleDeleteGroup}>
                                            <FontAwesomeIcon icon={faTrash} /> Delete Group
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="info-section">
                                    <h3>Group Information</h3>
                                    <div className="info-card">
                                        <div className="info-item">
                                            <h4>Description</h4>
                                            <p>{groupDetails.desc}</p>
                                        </div>
                                        
                                        <div className="info-item">
                                            <h4>Tags</h4>
                                            <div className="tags-list">
                                                {Array.isArray(groupDetails.tags) && groupDetails.tags.length > 0 ? (
                                                    groupDetails.tags.map((tag, i) => (
                                                        <span className="tag" key={i}>#{tag}</span>
                                                    ))
                                                ) : (
                                                    <span className="no-tags">No tags</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="info-item">
                                            <h4>Admin</h4>
                                            {groupDetails.admin ? (
                                                <div className="admin-info">
                                                    <span className="admin-name">
                                                        <FontAwesomeIcon icon={faShieldAlt} /> {groupDetails.admin.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p>No admin details available</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="members-section">
                                    <h3>
                                        <FontAwesomeIcon icon={faUsers} /> Members 
                                        <span className="member-count">
                                            ({groupDetails.members ? Object.keys(groupDetails.members).length : 0})
                                        </span>
                                    </h3>
                                    
                                    {groupDetails.members && Object.keys(groupDetails.members).length > 0 ? (
                                        <div className="members-grid">
                                            {Object.entries(groupDetails.members).map(([username, member]) => (
                                                <div className="member-card" key={username}>
                                                    <div className="member-header">
                                                        <div className="member-avatar" style={{ backgroundColor: `hsl(${username.charCodeAt(0) * 10 % 360}, 70%, 50%)` }}>
                                                            {username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="member-info">
                                                            <h4 className="member-name">{username}</h4>
                                                            <div className="member-status">
                                                                <span className={`status-indicator ${member.isLogin ? 'online' : 'offline'}`}></span>
                                                                {member.isLogin ? 'Online' : 'Offline'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="member-details">
                                                        <div className="member-join-date">
                                                            <FontAwesomeIcon icon={faCalendarAlt} />
                                                            <span>Joined: {new Date(member.joindate).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        className="btn btn-danger btn-sm remove-member" 
                                                        onClick={() => handleRemoveMember(username)}
                                                    >
                                                        <FontAwesomeIcon icon={faUserMinus} /> Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-members">
                                            <p>No members have joined this group yet.</p>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="admin-footer">
                                    <button className="btn btn-secondary btn-sm" onClick={handleBack}>
                                        <FontAwesomeIcon icon={faSignOutAlt} /> Exit Admin Panel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="not-found-container">
                        <div className="not-found-icon">
                            <FontAwesomeIcon icon={faUsers} size="4x" />
                        </div>
                        <h2>No group details found</h2>
                        <p>The group you're looking for might have been deleted or doesn't exist.</p>
                        <button type="button" className="btn btn-primary" onClick={handleBack}>
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Admin;
