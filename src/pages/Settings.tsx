import React, { useState } from 'react';
import { Save, User, Lock, Hotel, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile information
      const { error: updateError } = await supabase
        .from('staff')
        .update({ full_name: profileData.full_name })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Update password if provided
      if (profileData.new_password) {
        if (profileData.new_password !== profileData.confirm_password) {
          throw new Error('New passwords do not match');
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: profileData.new_password
        });

        if (passwordError) throw passwordError;
      }

      toast.success('Settings updated successfully');
      setProfileData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (error) {
      toast.error('Error updating settings');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 space-y-6">
          <div className="border-b border-gray-200 pb-6">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Profile Settings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Update your profile information
            </p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Change Password
              </h3>
              <div className="mt-4 grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={profileData.current_password}
                    onChange={(e) => setProfileData({ ...profileData, current_password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={profileData.new_password}
                    onChange={(e) => setProfileData({ ...profileData, new_password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={profileData.confirm_password}
                    onChange={(e) => setProfileData({ ...profileData, confirm_password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transform hover:scale-[1.02] transition-all duration-200"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Hotel className="h-5 w-5 mr-2" />
                Hotel Information
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                View hotel system information
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Hotel Name</dt>
                <dd className="mt-1 text-sm text-gray-900">MIYAKY HOTEL AND SUITES</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">System Version</dt>
                <dd className="mt-1 text-sm text-gray-900">1.0.0</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Currency</dt>
                <dd className="mt-1 text-sm text-gray-900">Nigerian Naira (₦)</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Time Zone</dt>
                <dd className="mt-1 text-sm text-gray-900">Africa/Lagos</dd>
              </div>
            </dl>
          </div>

          {/* Contact Support Section */}
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              Contact Support
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Need help? Contact our support team at:{' '}
              <a 
                href="mailto:petersdamilare5@gmail.com"
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                petersdamilare5@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}