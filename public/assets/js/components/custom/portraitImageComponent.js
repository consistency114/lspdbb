// portraitImageComponent.js

// 1) Tell Form.io about a new component called "portraitImage"
Formio.Components.addComponent(
    'portraitImage',
    {
      // These define how it appears in the builder palette
      builderInfo: {
        title: 'Portrait Image',
        group: 'custom',            // new "Custom" group
        icon: 'image',              // Font-awesome icon name
        weight: 70,                 // order in the palette
        schema: Formio.Components.file.schema({
          type: 'portraitImage',
          key: 'portraitImage',
          label: 'Portrait Image'
        })
      },
      // The JSON schema used when dropped into your form
      schema: Formio.Components.file.schema({
        type: 'portraitImage',
        key: 'portraitImage',
        label: 'Portrait Image'
      }),
    },
    // 2) The class that actually *renders* and *wires up* your component
    class PortraitImageComponent extends Formio.Components.components.file {
      attach(element) {
        super.attach(element);
  
        // Hide the default file input
        this.refs.input[0].style.display = 'none';
  
        // Create your drop-zone
        const dropZone = document.createElement('div');
        dropZone.id = this.component.key + 'Zone';
        dropZone.className = 'drop-zone';
        dropZone.innerText = '📥 Click or paste (Ctrl+V) or drag & drop an image here';
  
        element.appendChild(dropZone);
  
        // Add your CSS (you can also put this in a Custom CSS asset)
        const style = document.createElement('style');
        style.innerHTML = `
          .drop-zone { border:2px dashed #888; border-radius:6px; padding:40px; text-align:center; cursor:pointer; transition:.2s; }
          .drop-zone.active { border-color:#ffcc00; background:rgba(255,204,0,0.1); }
        `;
        document.head.appendChild(style);
  
        // Paste handler
        function onPaste(e) {
          e.preventDefault();
          document.removeEventListener('paste', onPaste);
          dropZone.classList.remove('active');
          for (let item of e.clipboardData.items) {
            if (item.type.startsWith('image/')) {
              upload(item.getAsFile());
              break;
            }
          }
        }
  
        // Drop handler
        function onDrop(e) {
          e.preventDefault();
          dropZone.classList.remove('active');
          upload(e.dataTransfer.files[0]);
        }
  
        // Upload & set the field’s value
        function upload(file) {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `https://api.imgbb.com/1/upload?key=7c28c7231f3674f342c2c382a750d29b`);
          const fd = new FormData();
          fd.append('image', file);
          xhr.onload = () => {
            const res = JSON.parse(xhr.responseText);
            if (res.success) {
              // this.setValue will update the component’s dataValue,
              // which reBB will render in your template as {{ data.portraitImage }}
              instance.setValue(res.data.url);
              alert('✅ Uploaded: ' + res.data.url);
            } else {
              alert('Upload error: ' + res.error.message);
            }
          };
          xhr.send(fd);
        }
  
        // Bind interactions
        dropZone.addEventListener('click', () => {
          dropZone.classList.add('active');
          document.addEventListener('paste', onPaste);
        });
        dropZone.addEventListener('dragover', e => {
          e.preventDefault();
          dropZone.classList.add('active');
        });
        dropZone.addEventListener('dragleave', () => {
          dropZone.classList.remove('active');
        });
        dropZone.addEventListener('drop', onDrop);
  
        // Keep a reference for upload callbacks
        const instance = this;
  
        return this;
      }
    }
  );
  