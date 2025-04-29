/**
 * custom.js - Custom Utility Functions
 * 
 * This file provides simple functionality that can be used
 * throughout your website or application.
 * 
 * @file
 * @version 1.0
 * @description A lightweight custom utility for web applications
 */

/**
 * Creates or updates a cookie with the specified name and value
 * 
 * @param {string} name - The name of the cookie to set
 * @param {string} value - The value to store in the cookie
 * @param {number} daysToLive - Number of days until the cookie expires (default: 7 days)
 * 
 * @example
 * // Set a cookie that expires in 7 days (default)
 * setCookie("username", "John");
 * 
 * // Set a cookie that expires in 30 days
 * setCookie("preferences", "darkMode", 30);
 * 
 * // Set a session cookie (expires when browser is closed)
 * setCookie("temporaryData", "someValue", 0);
 */
function setCookie(name, value, daysToLive = 7) {
    const date = new Date();
    date.setTime(date.getTime() + (daysToLive * 24 * 60 * 60 * 1000));
    const expires = "expires=" + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/`;
}
  
/**
 * Retrieves a cookie value by its name
 * 
 * This function searches through all available cookies and returns
 * the value of the specified cookie if found.
 * 
 * @param {string} name - The name of the cookie to retrieve
 * @returns {string|null} The value of the cookie if found, null otherwise
 * 
 * @example
 * // Check if a user has previously logged in
 * const username = getCookie("username");
 * if (username) {
 *     console.log(`Welcome back, ${username}!`);
 * } else {
 *     console.log("No user is currently logged in");
 * }
 */
function getCookie(name) {
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookies = decodedCookie.split(';');
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.startsWith(name + "=")) {
            return cookie.substring(name.length + 1);
        }
    }
    return null;
}
// custom.js

// Wait until the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Replace with your actual form URL or JSON schema variable
  const formUrl = 'https://yourproject.form.io/yourForm';

  // Render the form into the <div id="formio"></div>
  Formio.createForm(
    document.getElementById('formio'),
    formUrl
  ).then(function(form) {
    // Get the built-in File component by its key
    const portraitComp = form.getComponent('portrait');
    if (!portraitComp) {
      console.warn('Portrait component (key="portrait") not found.');
      return;
    }

    // Listen for paste events anywhere in the window
    window.addEventListener('paste', function(evt) {
      const clipboard = evt.clipboardData || evt.originalEvent.clipboardData;
      if (!clipboard) return;

      // Find the first file item (if any)
      for (let i = 0; i < clipboard.items.length; i++) {
        const item = clipboard.items[i];
        if (item.kind === 'file') {
          const blob = item.getAsFile();
          if (!blob) continue;

          // Upload via the File component’s API
          portraitComp.uploadFile([blob])
            .then(function(uploaded) {
              // Set the component’s value to the uploaded file object(s)
              portraitComp.setValue(uploaded);
            })
            .catch(function(err) {
              console.error('Portrait upload failed:', err);
            });
          break; // stop after the first image file
        }
      }
    });
  })
  .catch(function(err) {
    console.error('Form.io form error:', err);
  });
});
