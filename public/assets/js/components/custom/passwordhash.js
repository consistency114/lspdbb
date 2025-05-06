
console.log('🗝️ Loaded passwordhash.js, SECRET is:', window.__FORM_PASSWORD__);

const SECRET = window.__FORM_PASSWORD__ || '';

;(function() {
  // 2) Monkey‐patch Formio.createForm
  const origCreateForm = Formio.createForm;
  Formio.createForm = function(el, src, opts) {
    return origCreateForm.call(this, el, src, opts)
      .then(form => {
        // 3) Find your Password component by key:
        const pwComp = form.getComponent('specialkeyhash');
        if (pwComp && !pwComp._patched) {
          pwComp._patched = true;

          // 4) Overwrite its custom validation to use the injected SECRET
          pwComp.validate = pwComp.validate || {};
          pwComp.validate.custom = `valid = (input === ${JSON.stringify(SECRET)});`;
          pwComp.validate.customPrivate = false;      // client‐side
          pwComp.validate.customMessage = 'Incorrect password';

          // 5) Force a re‐validation so the Submit button state updates
          pwComp.setPristine(false);
          pwComp.checkValidity(pwComp.getValue(), true);
        }
        return form;
      });
  };
})();