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
  // const response = await fetch(url, defaultOptions);
  // const response = await window.electron.ipcRenderer.invoke('request', options)
  const req = { endpoint: endpoint, ...options };
  console.log(`apiClient request: ${JSON.stringify(req)}`)
  console.log('window.api: ' + JSON.stringify(window.api));


  console.log('apiClient: window.api:', window.api); // Should show the object with 'request'
  let response;
  if (window.api && typeof window.api.request === 'function') {
    response = await window.api.request(req);
  } else {
    console.error('window.api or window.api.request is not available.');
  }

  console.log("response: " + response)

  // const response = await window.api.request(req)
  // Return the response object
  return response;
};

export default apiClient;
