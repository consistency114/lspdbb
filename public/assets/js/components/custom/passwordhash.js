
(() => {
  const SECRET = window.__FORM_PASSWORD__ || '';

  const origCreateForm = Formio.createForm;
  Formio.createForm = function (el, src, opts) {
    return origCreateForm.call(this, el, src, opts).then(form => {
      const pwComp = form.getComponent('specialkeyhash');
      if (pwComp && !pwComp._patched) {
        pwComp._patched = true;

        // put custom rule on the schema object
        pwComp.component.validate = {
          ...pwComp.component.validate,
          custom: `valid = (input === ${JSON.stringify(SECRET)});`,
          customMessage: 'Incorrect password'
        };

        // redraw & re-validate immediately
        pwComp.redraw();
        pwComp.setPristine(false);
        pwComp.checkValidity(pwComp.getValue(), true);
        form.triggerChange();
      }
      return form;
    });
  };
})();
