import React from 'react';

const NewMemberForm = ({
    username,
    confirmPassword,
    password,
    passkey,
    setUsername,
    setPassword,
    setConfirmPassword,
    setPasskey,
    groupType,
    onSubmit,
    onCancel
}) => {
    const handleJoinClick = (e) => {
        e.preventDefault();
        onSubmit(); // Call the joinGroup function passed as a prop
    };

    return (
        <form onSubmit={handleJoinClick} className="new-member-form">
            <h2>Join Group</h2>
            <div className="form-group">
                <input
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    aria-label="Username"
                />
            </div>
            <div className="form-group">
                <input
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    aria-label="Password"
                />
            </div>
            <div className="form-group">
                <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    aria-label="Confirm Password"
                />
            </div>
            {groupType === 1 && ( // Check for private group
                <div className="form-group">
                    <input
                        type="password"
                        placeholder="Enter Passkey"
                        value={passkey}
                        onChange={(e) => setPasskey(e.target.value)}
                        required
                        aria-label="Passkey"
                    />
                </div>
            )}
            <div className="button-group">
                <button className="join-button" type="submit">
                    Join Group
                </button>
                <button className="close-button" type="button" onClick={onCancel}>
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default NewMemberForm;
