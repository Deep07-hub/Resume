import React from 'react';

interface DatabaseErrorAlertProps {
  error: string;
  details?: string;
  onRetry?: () => void;
}

const DatabaseErrorAlert: React.FC<DatabaseErrorAlertProps> = ({ error, details, onRetry }) => {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4 rounded shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0 pt-0.5">
          <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Database Connection Error</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{error}</p>
            {details && (
              <div className="mt-1 p-2 bg-red-100 rounded text-xs font-mono overflow-auto max-h-32 text-red-800">
                {details}
              </div>
            )}
          </div>
          <div className="mt-4">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Retry Connection
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseErrorAlert; 