/**
 * Portrait Image Component
 * Extends the standard File component to provide a drag-drop, click-to-paste, and paste-from-clipboard
 * image uploader that sends to ImgBB and stores the resulting URL as the component value.
 */
(function() {
  // Grab the base FileComponent from Form.io
  const FileComponent = Formio.Components.components.file;

  class PortraitImageComponent extends FileComponent {
    // How it appears in the builder palette
    static get builderInfo() {
      return {
        title: 'Portrait Image',
        group: 'custom',
        icon: 'image',
        weight: 70,
        schema: PortraitImageComponent.schema()
      };
    }

    // The default schema when dropped onto a form
    static schema(...extend) {
      return FileComponent.schema({
        type: 'portraitImage',
        key: 'portraitImage',
        label: 'Portrait Image',
        tableView: false,
        input: true,
        ...extend
      });
    }

    // No extra editForm overrides needed—uses FileComponent’s
    // attach is where we wire up our custom UI
    attach(element) {
      super.attach(element);

      // Hide the default file input
      if (this.refs.input && this.refs.input[0]) {
        this.refs.input[0].style.display = 'none';
      }

      // Create our drop-zone
      const dz = document.createElement('div');
      dz.className = 'drop-zone';
      dz.textContent = '📥 Click / Paste (Ctrl+V) / Drag-Drop portrait here';

      // Inject inline styles (since you can’t add separate CSS)
      const style = document.createElement('style');
      style.innerHTML = `
        .drop-zone {
          border:2px dashed #888;
          border-radius:6px;
          padding:20px;
          text-align:center;
          cursor:pointer;
          transition:0.2s;
          user-select:none;
          font: inherit;
          color: #444;
        }
        .drop-zone.active {
          border-color:#ffcc00;
          background:rgba(255,204,0,0.1);
        }
      `;
      document.head.appendChild(style);

      // Insert the drop-zone into the component wrapper
      this.element.appendChild(dz);

      // Core upload logic
      const upload = (file) => {
        const IMGBB_KEY = '7c28c7231f3674f342c2c382a750d29b';
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`);
        const fd = new FormData();
        fd.append('image', file);
        xhr.onload = () => {
          let res;
          try {
            res = JSON.parse(xhr.responseText);
          } catch (e) {
            return alert('Invalid response from ImgBB');
          }
          if (!res.success) {
            return alert('Upload error: ' + res.error.message);
          }
          // Set the component’s value to the returned URL
          this.setValue(res.data.url);
          alert('✅ Uploaded! URL saved.');
        };
        xhr.onerror = () => alert('Network error during upload');
        xhr.send(fd);
      };

      // Handle clipboard paste
      const onPaste = (e) => {
        e.preventDefault();
        dz.classList.remove('active');
        for (let item of e.clipboardData.items) {
          if (item.type.startsWith('image/')) {
            return upload(item.getAsFile());
          }
        }
        alert('No image found in clipboard');
      };

      // Bind interactions
      dz.addEventListener('click', () => {
        dz.classList.add('active');
        document.addEventListener('paste', onPaste, { once: true });
      });
      dz.addEventListener('dragover', (e) => {
        e.preventDefault();
        dz.classList.add('active');
      });
      dz.addEventListener('dragleave', () => {
        dz.classList.remove('active');
      });
      dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('active');
        upload(e.dataTransfer.files[0]);
      });

      return this;
    }
  }

  // Register it with Form.io
  Formio.Components.addComponent('portraitImage', PortraitImageComponent);

  // Expose globally for debugging
  window.PortraitImageComponent = PortraitImageComponent;
})();
