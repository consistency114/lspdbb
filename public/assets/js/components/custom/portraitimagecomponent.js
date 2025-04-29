
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
  