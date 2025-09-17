import React, { useState, useEffect } from 'react';

export default function AdminTempExtensions({ session }) {
  const [courseCodes, setCourseCodes] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('compre');
  const [activeExtensions, setActiveExtensions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCourseCodes();
    fetchActiveExtensions();
    
    // Set up automatic cleanup every 5 minutes
    const cleanupInterval = setInterval(() => {
      cleanupExpiredExtensions();
    }, 5 * 60 * 1000); // 5 minutes

    // Cleanup on component unmount
    return () => clearInterval(cleanupInterval);
  }, []);

  const cleanupExpiredExtensions = async () => {
    try {
      await fetch('/makeups/api/cleanup-extensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      // Refresh active extensions after cleanup
      fetchActiveExtensions();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const fetchCourseCodes = async () => {
    try {
      const response = await fetch('/makeups/api/get-all-course-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (data.courseCodes) {
        setCourseCodes(data.courseCodes);
      }
    } catch (error) {
      console.error('Error fetching course codes:', error);
    }
  };

  const fetchActiveExtensions = async () => {
    try {
      const response = await fetch(`/makeups/api/admin-temp-extension?session=${encodeURIComponent(JSON.stringify(session))}`);
      const data = await response.json();
      if (data.success) {
        setActiveExtensions(data.activeExtensions);
      }
    } catch (error) {
      console.error('Error fetching active extensions:', error);
    }
  };

  const handleExtend = async () => {
    if (!selectedCourse) {
      setMessage('Please select a course code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/makeups/api/admin-temp-extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extend',
          courseCode: selectedCourse,
          examType: selectedExamType,
          session: session
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        fetchActiveExtensions(); // Refresh the list
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(data.error || 'Failed to create extension');
      }
    } catch (error) {
      console.error('Error creating extension:', error);
      setMessage('Error creating extension');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async (courseCode, examType) => {
    setIsLoading(true);
    try {
      const response = await fetch('/makeups/api/admin-temp-extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'close',
          courseCode: courseCode,
          examType: examType,
          session: session
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage(data.message);
        fetchActiveExtensions(); // Refresh the list
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to close extension');
      }
    } catch (error) {
      console.error('Error closing extension:', error);
      setMessage('Error closing extension');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (extendedUntil) => {
    const now = new Date();
    const until = new Date(extendedUntil);
    const diffMs = until - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} minutes remaining`;
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Temporary Makeup Request Extensions
      </h2>
      
      {message && (
        <div className={`p-4 mb-6 rounded-md ${
          message.includes('Error') || message.includes('Failed') 
            ? 'bg-red-100 text-red-700 border border-red-300' 
            : 'bg-green-100 text-green-700 border border-green-300'
        }`}>
          {message}
        </div>
      )}

      {/* Create New Extension */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Create Temporary Extension
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Course Code
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="">Select Course Code</option>
              {courseCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Exam Type
            </label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isLoading}
            >
              <option value="midsem">Mid Semester Exam</option>
              <option value="compre">Comprehensive Exam</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExtend}
              disabled={isLoading || !selectedCourse}
              className={`w-full py-2 px-4 rounded-md font-medium ${
                isLoading || !selectedCourse
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {isLoading ? 'Creating...' : 'Extend for 10 Minutes'}
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          This will allow students to submit makeup requests for the selected course and exam type for the next 10 minutes.
        </p>
      </div>

      {/* Active Extensions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-700">
          Active Extensions
        </h3>
        
        {activeExtensions.length === 0 ? (
          <p className="text-gray-500 italic">No active extensions</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Course Code</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Exam Type</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Created By</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Extended Until</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Time Remaining</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activeExtensions.map((extension) => (
                  <tr key={`${extension.courseCode}-${extension.examType}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {extension.courseCode}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {extension.examType === 'compre' ? 'Comprehensive' : 'Mid Semester'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {extension.adminEmail}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {formatDateTime(extension.extendedUntil)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      <span className={`font-medium ${
                        getTimeRemaining(extension.extendedUntil) === 'Expired' 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        {getTimeRemaining(extension.extendedUntil)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <button
                        onClick={() => handleClose(extension.courseCode, extension.examType)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-xs"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}