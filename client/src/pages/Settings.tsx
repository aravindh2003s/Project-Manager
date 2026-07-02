import { useState } from 'react';
import { Bell, Shield, Palette, User as UserIcon, Globe } from 'lucide-react';

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const [name, setName] = useState('Demo User');
    const [email, setEmail] = useState('demo@nexus.io');
    const [bio, setBio] = useState('Full-stack developer passionate about building great tools.');
    const [emailNotifs, setEmailNotifs] = useState(true);
    const [pushNotifs, setPushNotifs] = useState(false);
    const [twoFactor, setTwoFactor] = useState(false);
    const [theme, setTheme] = useState('dark');
    const [language, setLanguage] = useState('en');
    const [saved, setSaved] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: <UserIcon size={14} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
        { id: 'appearance', label: 'Appearance', icon: <Palette size={14} /> },
        { id: 'security', label: 'Security', icon: <Shield size={14} /> },
    ];

    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your account preferences and workspace configuration</p>
            </div>

            <div className="settings-tabs">
                {tabs.map(tab => (
                    <button key={tab.id}
                        className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'profile' && (
                <form onSubmit={handleSave}>
                    <div className="settings-section">
                        <h2 className="settings-section-title">Public Profile</h2>
                        <div className="settings-form">
                            <div className="settings-avatar-section">
                                <div className="settings-avatar-large">D</div>
                                <div>
                                    <button type="button" className="btn" id="changeAvatarBtn">Change avatar</button>
                                    <p className="help-text" style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG or GIF. Max 2MB.</p>
                                </div>
                            </div>
                            <div className="settings-row">
                                <div className="settings-field">
                                    <label htmlFor="settingsName">Display Name</label>
                                    <input id="settingsName" type="text" value={name} onChange={e => setName(e.target.value)} />
                                </div>
                                <div className="settings-field">
                                    <label htmlFor="settingsEmail">Email</label>
                                    <input id="settingsEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                            </div>
                            <div className="settings-field">
                                <label htmlFor="settingsBio">Bio</label>
                                <textarea id="settingsBio" rows={3} value={bio} onChange={e => setBio(e.target.value)} />
                                <span className="help-text">Brief description for your profile. URLs are hyperlinked.</span>
                            </div>
                            <div className="settings-row">
                                <div className="settings-field">
                                    <label htmlFor="settingsUrl">Website</label>
                                    <input id="settingsUrl" type="url" placeholder="https://example.com" />
                                </div>
                                <div className="settings-field">
                                    <label htmlFor="settingsLocation">Location</label>
                                    <input id="settingsLocation" type="text" placeholder="City, Country" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-actions">
                        {saved && <span className="color-success" style={{ fontSize: '0.875rem', marginRight: 'auto' }}>Settings saved!</span>}
                        <button type="submit" className="btn btn-primary" id="saveProfileBtn">Update Profile</button>
                    </div>
                </form>
            )}

            {activeTab === 'notifications' && (
                <div className="settings-section">
                    <h2 className="settings-section-title">Notification Preferences</h2>
                    <div className="settings-form">
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <span className="settings-toggle-label">Email notifications</span>
                                <span className="settings-toggle-desc">Receive email updates about project activity</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={emailNotifs} onChange={e => setEmailNotifs(e.target.checked)} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <span className="settings-toggle-label">Push notifications</span>
                                <span className="settings-toggle-desc">Get browser push notifications for mentions and assignments</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={pushNotifs} onChange={e => setPushNotifs(e.target.checked)} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <span className="settings-toggle-label">CI/CD alerts</span>
                                <span className="settings-toggle-desc">Notify when pipeline runs complete or fail</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" defaultChecked />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <span className="settings-toggle-label">Weekly digest</span>
                                <span className="settings-toggle-desc">Receive a weekly summary of workspace activity</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" defaultChecked />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'appearance' && (
                <div className="settings-section">
                    <h2 className="settings-section-title">Theme & Display</h2>
                    <div className="settings-form">
                        <div className="settings-field">
                            <label htmlFor="settingsTheme"><Palette size={14} /> Theme</label>
                            <select id="settingsTheme" title="Theme" value={theme} onChange={e => setTheme(e.target.value)}>
                                <option value="dark">Dark (Default)</option>
                                <option value="light">Light</option>
                                <option value="system">System preference</option>
                            </select>
                        </div>
                        <div className="settings-field">
                            <label htmlFor="settingsLang"><Globe size={14} /> Language</label>
                            <select id="settingsLang" title="Language" value={language} onChange={e => setLanguage(e.target.value)}>
                                <option value="en">English</option>
                                <option value="es">Español</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsch</option>
                                <option value="ja">日本語</option>
                            </select>
                        </div>
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <span className="settings-toggle-label">Compact mode</span>
                                <span className="settings-toggle-desc">Reduce spacing and padding in the interface</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'security' && (
                <div>
                    <div className="settings-section">
                        <h2 className="settings-section-title">Authentication</h2>
                        <div className="settings-form">
                            <div className="settings-field">
                                <label htmlFor="currentPassword">Current password</label>
                                <input id="currentPassword" type="password" placeholder="Enter current password" />
                            </div>
                            <div className="settings-row">
                                <div className="settings-field">
                                    <label htmlFor="newPassword">New password</label>
                                    <input id="newPassword" type="password" placeholder="Enter new password" />
                                </div>
                                <div className="settings-field">
                                    <label htmlFor="confirmPassword">Confirm password</label>
                                    <input id="confirmPassword" type="password" placeholder="Confirm new password" />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-primary" id="changePasswordBtn">Update Password</button>
                            </div>
                        </div>
                    </div>
                    <div className="settings-section">
                        <h2 className="settings-section-title">Two-Factor Authentication</h2>
                        <div className="settings-toggle-row">
                            <div className="settings-toggle-info">
                                <span className="settings-toggle-label">Enable 2FA</span>
                                <span className="settings-toggle-desc">Add an extra layer of security to your account using TOTP</span>
                            </div>
                            <label className="toggle-switch">
                                <input type="checkbox" checked={twoFactor} onChange={e => setTwoFactor(e.target.checked)} />
                                <span className="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    <div className="settings-danger-zone">
                        <h3>Danger Zone</h3>
                        <div className="settings-danger-item">
                            <div className="settings-danger-text">
                                <strong>Delete account</strong>
                                <p>Once deleted, your account and all data will be permanently removed.</p>
                            </div>
                            <button className="btn btn-danger" id="deleteAccountBtn">Delete Account</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
