import React from 'react';

const OldMemberForm = ({
    username,
    password,
    passkey,
    setUsername,
    setPassword,
    setPasskey,
    groupType,
    onSubmit,
    onCancel
}) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(); // Call the joinGroup function passed as a prop
    };

    return (
        <form onSubmit={handleSubmit} className="old-member-form">
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

export default OldMemberForm;
