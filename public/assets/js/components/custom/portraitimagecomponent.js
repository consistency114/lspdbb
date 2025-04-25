/*  public/assets/js/components/custom/portraitImageComponent.js  */
(function () {
  const FieldComponent = Formio.Components.components.field;   // simple base class

  class PortraitImageComponent extends FieldComponent {
    /* palette entry */
    static get builderInfo() {
      return {
        title:  'Portrait Image',
        group:  'custom',
        icon:   'image',
        weight: 70,
        schema: PortraitImageComponent.schema()
      };
    }

    /* default schema */
    static schema(...extend) {
      return FieldComponent.schema({
        type: 'portraitImage',
        key:  'portraitImage',
        label: 'Portrait Image',
        input: true,
        tableView: false,
        ...extend
      });
    }

    /* 🔸 render our own template – just the drop-zone */
    render() {
      return super.render(`
        <div class="drop-zone" ref="dropzone">
          📥 Click / Paste (Ctrl+V) / Drag-drop portrait here
        </div>
      `);
    }

    /* 🔸 attach – add CSS + event logic (skipped while in builder UI) */
    attach(element) {
      const attached = super.attach(element);
      this.dropZone  = this.refs.dropzone;

      /* Inject minimal css once */
      if (!document.getElementById('portrait-image-css')) {
        const st = document.createElement('style');
        st.id  = 'portrait-image-css';
        st.textContent = `
          .drop-zone{
            border:2px dashed #888;border-radius:6px;padding:20px;text-align:center;
            cursor:pointer;user-select:none;transition:.2s;font:inherit;color:#444
          }
          .drop-zone.active{
            border-color:#ffcc00;background:rgba(255,204,0,.12);color:#aa8800
          }`;
        document.head.appendChild(st);
      }

      /* If we’re in the Form Builder, don’t bind interactivity – just show a stub */
      if (this.builderMode) {
        this.dropZone.style.opacity = 0.6;
        this.dropZone.innerHTML = 'Portrait Image<br><small>(drag to canvas – click gear to edit)</small>';
        return attached;
      }

      /* -------- runtime interactivity -------- */
      const setActive = on => this.dropZone.classList.toggle('active', on);
      const IMGBB = '7c28c7231f3674f342c2c382a750d29b';

      const upload = file => {
        if (!file || !file.type.startsWith('image/')) {
          return alert('Not an image file!');
        }
        const fd  = new FormData();
        fd.append('image', file);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.imgbb.com/1/upload?key=${IMGBB}`);
        xhr.onload = () => {
          let res;
          try { res = JSON.parse(xhr.responseText); }
          catch { return alert('Bad response from ImgBB'); }
          if (!res.success) return alert('Upload error: ' + res.error.message);

          /* store URL as component value */
          this.setValue(res.data.url);
          alert('✅ Uploaded!');
        };
        xhr.onerror = () => alert('Network error during upload');
        xhr.send(fd);
      };

      /* clipboard + dnd */
      const onPaste = e => {
        e.preventDefault();
        document.removeEventListener('paste', onPaste);
        setActive(false);
        for (const item of e.clipboardData.items) {
          if (item.type.startsWith('image/')) return upload(item.getAsFile());
        }
        alert('Clipboard had no image');
      };

      this.addEventListener(this.dropZone, 'click', () => {
        setActive(true);
        this.dropZone.textContent = '⌨️ Paste now (Ctrl+V)…';
        document.addEventListener('paste', onPaste, { once: true });
      });
      this.addEventListener(this.dropZone, 'dragover', e => { e.preventDefault(); setActive(true); });
      this.addEventListener(this.dropZone, 'dragleave', () => setActive(false));
      this.addEventListener(this.dropZone, 'drop', e => {
        e.preventDefault();
        setActive(false);
        upload(e.dataTransfer.files[0]);
      });

      return attached;
    }

    /* Form.io boilerplate – value is a simple string */
    getValue() {
      return this.dataValue || '';
    }
    updateValue(value, flags) {
      super.updateValue(value, flags);
    }
  }

  /* register */
  Formio.Components.addComponent('portraitImage', PortraitImageComponent);
  window.PortraitImageComponent = PortraitImageComponent;      // debugging
})();
