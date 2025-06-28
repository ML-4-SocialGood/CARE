import getSiteUrl from './getSiteUrl';

const apiClient = async (endpoint, options = {}) => {
  const baseUrl = getSiteUrl();
  const url = `${baseUrl}${endpoint}`;

  // Default options for the fetch request
  const defaultOptions = {
    credentials: 'include', // Ensures cookies are sent with requests
    ...options, // Allow options to be overridden
  };

  // Perform the fetch request
  const response = await fetch(url, defaultOptions);

  // Return the response object
  return response;
};

export default apiClient;
