// public/js/app/custom.js
//
// Clipboard-to-Cloudinary helper for the “portrait” File component.
// – Single-file component: stores a plain URL string
// – Multi-file component: stores a full file-object array
// In both cases the Form.io thumbnail preview works.
//

console.log('🛠️ imagecomp.js loaded @', new Date());

(function () {
  /* ------------------------------------------------------------------ *
   * 1) Monkey-patch Formio.createForm (and embed) so we can attach our
   *    clipboard handler as soon as the form instance is available.
   * ------------------------------------------------------------------ */
  const origCreateForm = Formio.createForm;
  Formio.createForm = function (el, src, options) {
    console.log('🐞 Formio.createForm intercepted', el, src, options);
    return origCreateForm.call(this, el, src, options).then((form) => {
      console.log('🎉 Form created:', form);
      setupClipboardUpload(form);
      return form;
    });
  };

  if (Formio.embed) {
    const origEmbed = Formio.embed;
    Formio.embed = function (el, src, options) {
      console.log('🐞 Formio.embed intercepted', el, src, options);
      return origEmbed.call(this, el, src, options).then((form) => {
        console.log('🎉 Form embedded:', form);
        setupClipboardUpload(form);
        return form;
      });
    };
  }

  /* ------------------------------------------------------------------ *
   * 2) Clipboard-upload installer
   * ------------------------------------------------------------------ */
  function setupClipboardUpload(form) {
    const portraitComp = form.getComponent('portrait');
    if (!portraitComp) {
      console.warn('⚠️  Portrait component not found in this form');
      return;
    }
    console.log('✔️  Portrait component ready:', portraitComp);

    // Prevent double-install on the same form instance
    if (portraitComp._clipboardHooked) return;
    portraitComp._clipboardHooked = true;

    window.addEventListener('paste', function onPaste(e) {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.kind === 'file') {
          const blob = item.getAsFile();
          console.log('📋 Pasted blob:', blob);

          // Upload to Cloudinary
          const fd = new FormData();
          fd.append('file', blob);
          fd.append('upload_preset', 'lspdbb');

          fetch('https://api.cloudinary.com/v1_1/djkjdawqi/image/upload', {
            method: 'POST',
            body: fd,
          })
            .then((r) => r.json())
            .then((json) => {
              console.log('☁️  Cloudinary response:', json);

              /* ----------------------------------------------
               * SINGLE-file component → just the secure_url
               * MULTI-file component  → full file object
               * ---------------------------------------------- */
              if (portraitComp.component.multiple) {
                const fileObj = {
                  url: json.secure_url,
                  name:
                    (json.original_filename || json.public_id) +
                    '.' +
                    json.format,
                  size: json.bytes,
                  type: 'image/' + json.format,
                  storage: 'url',
                };
                portraitComp.setValue([fileObj]); // array for multi
                console.log('✅ portrait setValue(array)', fileObj);
              } else {
                portraitComp.setValue(json.secure_url); // plain string
                console.log('✅ portrait setValue(string)', json.secure_url);
              }
            })
            .catch((err) =>
              console.error('❌ Cloudinary upload failed:', err)
            );

          break; // only handle the first file item
        }
      }
    });
  }
})();
