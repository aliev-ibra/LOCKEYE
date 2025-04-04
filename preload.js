// Preload script
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed')
  
  // Fix for incorrect asset paths
  document.querySelectorAll('link[href^="/login/"], script[src^="/login/"]').forEach(element => {
    const attr = element.tagName === 'LINK' ? 'href' : 'src';
    const originalPath = element.getAttribute(attr);
    if (originalPath && originalPath.startsWith('/login/')) {
      const newPath = originalPath.replace('/login/', '/');
      console.log(`Fixing path: ${originalPath} -> ${newPath}`);
      element.setAttribute(attr, newPath);
    }
  });
})

// Add error handling
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error)
  console.error('Error message:', event.message)
  console.error('Error source:', event.filename, 'line:', event.lineno, 'column:', event.colno)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

// Expose process versions to renderer
window.electronVersions = process.versions