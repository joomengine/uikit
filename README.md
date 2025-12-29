# VDM Uikit File Integration Guide

## Overview

Upload/Delete is an intuitive and lightweight JavaScript solution for embedding upload functionality into your website. By simply adding the `vdm-uikit` class to any element that triggers an upload, you can enable users to upload files easily.

## How to Add Uploader to Your Website

1. **Include the Uploader JavaScript File:**

   First, include the Uploader script in the `<head>` section of your HTML document:

   ```html
   <!-- Include the Uploader script from jsDelivr CDN -->
   <script src="https://cdn.jsdelivr.net/gh/joomengine/uikit@latest/dist/js/vdm.min.js"></script>
   ```

2. **Markup Your Upload Area:**

   In the body of your HTML document, apply the `vdm-uikit` class to any element that should trigger an upload action. Here is an example using a custom div:

   ```html
   <select id="type-field-id" class="uk-select" aria-label="Select">
        <option value="guid-value-1">Option 01</option>
        <option value="guid-value-2">Option 02</option>
   </select>

   <div id="upload_id" class="vdm-uikit uk-placeholder uk-text-center"
        data-type-id="type-field-id"
        data-progressbar-id="progressbar-id"
        data-display-id="display-id"
        data-success-id="success-id"
        data-error-id="error-id"
        data-allowed-format-id="allowed-format-id"
        data-file-type-id="file-type-id"
    hidden>
       <span uk-icon="icon: cloud-upload"></span>
       <span class="uk-text-middle">Attach <span id="file-type-id">file</span> by dropping them here or</span>
       <div uk-form-custom>
           <input type="file" multiple>
           <span class="uk-link">selecting one</span> <span id="allowed-format-id"></span>
       </div>
   </div>

   <progress id="progressbar-id" class="uk-progress" value="0" max="100" hidden></progress>

   <div id="success-id" hidden></div>
   <div id="error-id" hidden></div>
   <div id="display-id" hidden></div>
   ```

3. **Initializing the Uploader:**

   The script will automatically initialize all elements with the `vdm-uikit` class. You don’t need to manually initialize it unless additional customization is required.

4. **Customization:**

   You must set the various field configurations this way (before loading the class file):
   ```js
   <script>
   window.vdm.uikit.config = {
      endpoint_type: 'https://your-type-endpoint.com',
      target_class: 'vdm-uikit',
      upload_id: {
         endpoint_upload: 'https://your-upload-endpoint.com',
         endpoint_diplay: 'https://your-display-endpoint.com',
         endpoint_delete: 'https://your-delete-endpoint.com'
      }
   };
   </script>
   <script src="https://cdn.jsdelivr.net/gh/joomengine/uikit@latest/dist/js/vdm.min.js"></script>
   ```

### Preventing UIkit Collisions

The Uploader script has been designed to work independently of any existing UIkit installation on your website. It checks for existing instances of UIkit and uses them if they exist. If no UIkit instance is present, it loads its own copy.

## License

Copyright [Llewellyn van der Merwe](https://git.vdm.dev/Llewellyn) under the [MIT license](LICENSE.md).
