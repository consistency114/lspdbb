/* PortraitImageComponent.js – self-contained widget */
(function () {
  const Base = Formio.Components.components.field;

  class PortraitImageComponent extends Base {
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
      return Base.schema({
        type:  'portraitImage',
        key:   'portraitImage',
        label: 'Portrait Image',
        input: true,
        tableView: false,
        ...extend
      });
    }

    /* our template – a single drop zone div */
    render() {
      return super.render(`
        <div class="pi-dropzone" ref="dz">
          📥 Click / Paste (Ctrl+V) / Drag-Drop an image
        </div>
      `);
    }

    attach(el) {
      const attached = super.attach(el);
      this.dz = this.refs.dz;

      /* -------- builder mode (visual only) -------- */
      if (this.builderMode) {
        this.dz.style.opacity = .6;
        this.dz.style.cursor  = 'not-allowed';
        this.dz.innerHTML = 'Portrait Image<br><small>(click gear to edit)</small>';
        return attached;
      }

      /* one-time css */
      if (!document.getElementById('pi-style')) {
        const st = document.createElement('style');
        st.id = 'pi-style';
        st.textContent = `
          .pi-dropzone{
            border:2px dashed #888;border-radius:6px;padding:30px;text-align:center;
            cursor:pointer;user-select:none;font:inherit;color:#444;transition:.2s
          }
          .pi-dropzone.active{
            border-color:#ffcc00;background:rgba(255,204,0,.12);color:#aa8800
          }`;
        document.head.appendChild(st);
      }

      /* ---- helpers ---- */
      const setActive = on => this.dz.classList.toggle('active', on);
      const resetText = () => {
        this.dz.innerHTML = '📥 Click / Paste (Ctrl+V) / Drag-Drop an image';
      };
      const KEY = '7c28c7231f3674f342c2c382a750d29b';

      const showPreview = url => {
        this.dz.innerHTML =
          `<img src="${url}" style="max-width:250px;max-height:250px;object-fit:cover;border-radius:4px;"><br>` +
          `<small style="color:#555">Click to replace</small>`;
      };

      const upload = file => {
        if (!file || !file.type.startsWith('image/')) {
          alert('Not an image file'); return;
        }
        setActive(true);
        this.dz.innerHTML = '⬆️ Uploading…';
        const fd  = new FormData();
        fd.append('image', file);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.imgbb.com/1/upload?key=${KEY}`);
        xhr.onload = () => {
          let r; try { r = JSON.parse(xhr.responseText); } catch { return alert('Bad ImgBB response'); }
          if (!r.success) return alert('Upload error: ' + r.error.message);
          const url = r.data.url;
          this.setValue(url);
          showPreview(url);
          setActive(false);
        };
        xhr.onerror = () => { alert('Network error'); setActive(false); resetText(); };
        xhr.send(fd);
      };

      /* clipboard paste handler (runs once each click) */
      const onPaste = e => {
        e.preventDefault();
        document.removeEventListener('paste', onPaste);
        setActive(false);
        resetText();
        for (const it of e.clipboardData.items) {
          if (it.type.startsWith('image/')) return upload(it.getAsFile());
        }
        alert('No image in clipboard');
      };

      /* events */
      this.addEventListener(this.dz, 'click', () => {
        setActive(true);
        this.dz.textContent = '⌨️ Paste now (Ctrl+V)…';
        document.addEventListener('paste', onPaste, { once:true });
      });
      this.addEventListener(this.dz, 'dragover',  e => { e.preventDefault(); setActive(true); });
      this.addEventListener(this.dz, 'dragleave', () => setActive(false));
      this.addEventListener(this.dz, 'drop', e => {
        e.preventDefault(); setActive(false); resetText();
        upload(e.dataTransfer.files[0]);
      });

      /* if value already exists (form re-load) show preview */
      if (this.dataValue) showPreview(this.dataValue);

      return attached;
    }

    /* getter needed by Form.io */
    getValue() { return this.dataValue || ''; }
  }

  /* register */
  Formio.Components.addComponent('portraitImage', PortraitImageComponent);
})();
