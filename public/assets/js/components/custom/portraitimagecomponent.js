// public/js/app/custom.js

console.log('🛠️ imagecomp.js loaded @', new Date());

(function(){
  // 1) Monkey-patch Formio.createForm
  const origCreateForm = Formio.createForm;
  Formio.createForm = function(el, src, options) {
    console.log('🐞 Formio.createForm intercepted', el, src, options);
    return origCreateForm.call(this, el, src, options)
      .then(form => {
        console.log('🎉 Form created, form instance:', form);
        setupClipboardUpload(form);
        return form;
      });
  };

  // 2) If you also use Formio.embed(), patch that too:
  if (Formio.embed) {
    const origEmbed = Formio.embed;
    Formio.embed = function(el, src, options) {
      console.log('🐞 Formio.embed intercepted', el, src, options);
      return origEmbed.call(this, el, src, options)
        .then(form => {
          console.log('🎉 Form embedded, form instance:', form);
          setupClipboardUpload(form);
          return form;
        });
    };
  }

  // 3) Your Cloudinary upload & paste-handler installer
  function setupClipboardUpload(form) {
    const portraitComp = form.getComponent('portrait');
    if (!portraitComp) {
      console.warn('⚠️ Portrait component not found on this form instance');
      return;
    }
    console.log('✔️ Portrait component ready:', portraitComp);

    // Only install once per form instance
    if (portraitComp._clipboardHooked) {
      return;
    }
    portraitComp._clipboardHooked = true;

    window.addEventListener('paste', function onPaste(e) {
      console.log('📋 paste event:', e);

      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (let item of items) {
        console.log(' • clipboard item:', item.kind, item.type);
        if (item.kind === 'file') {
          const blob = item.getAsFile();
          console.log(' → got blob:', blob);

          // Upload straight to Cloudinary
          const data = new FormData();
          data.append('file', blob);
          data.append('upload_preset', 'lspdbb');

          fetch('https://api.cloudinary.com/v1_1/djkjdawqi/image/upload', {
            method: 'POST',
            body: data
          })
          .then(r => r.json())
          .then(json => {
            console.log('☁️ Cloudinary response:', json);
            portraitComp.setValue([{ url: json.secure_url }]);
            console.log('✅ portraitComp value set to', json.secure_url);
          })
          .catch(err => console.error('❌ Cloudinary upload failed:', err));

          break;
        }
      }
    });
  }
})();
