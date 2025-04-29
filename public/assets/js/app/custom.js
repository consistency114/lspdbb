console.log('🛠️ custom.js is running!', new Date());
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

console.log('🛠️ custom.js is still running!', new Date());

// public/js/custom.js

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('formio');
  if (!container) {
    console.warn('❌ #formio container not found');
    return;
  }

  container.addEventListener('formio-render', function(evt) {
    const form = evt.detail.form;
    console.log('⚙️ formio-render fired, form instance:', form);

    const portraitComp = form.getComponent('portrait');
    if (!portraitComp) {
      console.warn('❌ Portrait component not found');
      return;
    }
    console.log('✔︎ Portrait component ready:', portraitComp);

    window.addEventListener('paste', function pasteHandler(e) {
      console.log('📋 Paste event:', e);

      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(` • clipboard item[${i}] kind=${item.kind}, type=${item.type}`);
        if (item.kind === 'file') {
          const blob = item.getAsFile();
          console.log(' → clipboard blob:', blob);

          // Build Cloudinary upload payload
          const data = new FormData();
          data.append('file', blob);
          data.append('upload_preset', 'lspdbb');  // your unsigned preset

          fetch('https://api.cloudinary.com/v1_1/djkjdawqi/image/upload', {
            method: 'POST',
            body: data
          })
          .then(res => res.json())
          .then(json => {
            console.log('☁️ Cloudinary response:', json);
            const url = json.secure_url;
            // Set the Portrait component’s value to this URL
            portraitComp.setValue([{ url }]);
            console.log('✅ portraitComp value set to', url);
          })
          .catch(err => console.error('❌ Cloudinary upload error:', err));

          break; // only handle first file
        }
      }
      // If you want multiple pastes in one session remove { once: true }
    }, { once: true });
  });
});

