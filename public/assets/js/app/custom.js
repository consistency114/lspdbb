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
// custom.js

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('formio');
  if (!container) {
    console.warn('Form container #formio not found');
    return;
  }

  container.addEventListener('formio-render', function(evt) {
    const form = evt.detail.form;
    console.log('Form.io render event fired, form instance:', form);

    const portraitComp = form.getComponent('portrait');
    if (!portraitComp) {
      console.warn('Portrait component (key="portrait") not found');
      return;
    }
    console.log('Portrait component found:', portraitComp);

    window.addEventListener('paste', function(e) {
      console.log('Paste event detected:', e);

      const clipboard = e.clipboardData || (e.originalEvent && e.originalEvent.clipboardData);
      if (!clipboard) {
        console.warn('No clipboardData available on event');
        return;
      }

      let fileFound = false;
      for (let i = 0; i < clipboard.items.length; i++) {
        const item = clipboard.items[i];
        console.log(`Clipboard item [${i}] kind=${item.kind}, type=${item.type}`);

        if (item.kind === 'file') {
          const blob = item.getAsFile();
          if (!blob) {
            console.warn('item.kind==="file" but getAsFile() returned null');
            continue;
          }
          fileFound = true;
          console.log('Image file blob detected, size:', blob.size, 'type:', blob.type);

          portraitComp.uploadFile([blob])
            .then(uploaded => {
              console.log('Upload succeeded, uploaded file:', uploaded);
              portraitComp.setValue(uploaded);
              console.log('Portrait component value set to uploaded file');
            })
            .catch(err => {
              console.error('Portrait upload failed:', err);
            });
          break; // stop after first file
        }
      }
      if (!fileFound) {
        console.log('No file item found in clipboard; perhaps text was pasted instead?');
      }
    });
  });
});
