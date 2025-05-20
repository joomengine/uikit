import { UploadFile } from './core/upload-file';
import { DeleteFile } from './core/delete-file';

(function(global) {
    document.addEventListener('DOMContentLoaded', function() {
        let UIkitLocal;

        if (!global.UIkit) {
            UIkitLocal = require('uikit').default;
        } else {
            UIkitLocal = global.UIkit;
        }

        if (!global.VDM) {
            if (process.env.DEBUG) console.error('VDM is not defined, exiting initialization.');
            return;
        }

        const { endpoint_type, target_class, ...additionalConfig } = global.VDM.uikit.config || {};

        if (!endpoint_type) {
            if (process.env.DEBUG) console.error('File Type Endpoint is not defined, exiting initialization.');
            return;
        }

        if (!target_class) {
            if (process.env.DEBUG) console.error('The target class is not defined, exiting initialization.');
            return;
        }

        const uploadElements = document.querySelectorAll('.' + target_class);
        const config = {};

        // Ensure the global.VDM.uikit.delete_file exists, or initialize it
        if (!global.VDM.uikit.delete_file) {
            global.VDM.uikit.delete_file = {};  // Initialize delete_file object if it doesn't exist
        }

        uploadElements.forEach(element => {
            const id = element.getAttribute('id');
            const uploadEndpoint = additionalConfig[id]?.endpoint_upload ?? null;

            if (!uploadEndpoint) {
                if (process.env.DEBUG) console.error(`Upload Endpoint for ${id} is not defined, exiting initialization for this field.`);
                return; // Skip this field if no upload endpoint is found
            }

            const typeId = element.dataset.typeId;

            // optional
            const progressBarId = element.dataset.progressbarId ?? null;
            const displayEndpoint = additionalConfig[id]?.endpoint_display ?? null;
            const displayId = element.dataset.displayId || null;
            const deleteEndpoint = additionalConfig[id]?.endpoint_delete ?? null;
            const successId = element.dataset.successId || null;
            const errorId = element.dataset.errorId || null;
            const allowedFormatId = element.dataset.allowedFormatId || null;
            const fileTypeId = element.dataset.fileTypeId || null;

            config[id] = {
                bar: progressBarId,
                typeId: typeId,
                endpoint: uploadEndpoint,
                successId: successId,
                errorId: errorId,
                allowedFormatId: allowedFormatId,
                fileTypeId: fileTypeId,
                displayId: displayId,
                displayEndpoint: displayEndpoint
            };

            // if delete endpoint found
            if (deleteEndpoint)
            {
                global.VDM.uikit.delete_file[id] = new DeleteFile(deleteEndpoint, UIkitLocal);
            }
        });

        if (Object.keys(config).length > 0) {
            new UploadFile(config, endpoint_type, UIkitLocal);
        }

    });

    /**
     * Performs a delete operation on the specified file.
     *
     * @param {string} id - The identifier of the delete_file object.
     * @param {string} guid - The file GUID to delete.
     *
     * @return {void} - No return value.
     */
    global.VDMDeleteFile = function(id, guid) {
        const deleteInstance = global.VDM.uikit.delete_file[id];

        if (!deleteInstance || !(deleteInstance instanceof DeleteFile)) {
            if (process.env.DEBUG) console.error(`Error: delete_file with id ${id} is either not defined or not an instance of DeleteFile.`);
        }

        deleteInstance.delete(guid);
    };

    /**
     * Performs a delete operation on the specified set of files.
     *
     * @param {string} id - The identifier of the delete_file object.
     * @param {string[]} guids - Array of file GUIDs to delete.
     *
     * @return {void}
     */
    global.VDMDeleteFiles = function(id, guids) {
        const deleteInstance = global.VDM.uikit.delete_file[id];

        if (!Array.isArray(guids) || guids.length === 0) {
            if (process.env.DEBUG) console.error('No GUIDs provided for deletion.');
            return;
        }

        if (!deleteInstance || !(deleteInstance instanceof DeleteFile)) {
            if (process.env.DEBUG) console.error(`Error: delete_file with id ${id} is either not defined or not an instance of DeleteFile.`);
            return;
        }

        // Dispatch before batch delete
        document.dispatchEvent(new CustomEvent('vdm.uikit.delete.beforeFilesDelete', { guids: guids }));

        const [first, ...rest] = guids;
        const allGuids = [...guids];
        const deletedGuids = new Set();

        const afterDeleteHandler = (event) => {
            const guid = event.detail?.guid;

            if (!guid || !allGuids.includes(guid)) {
                return;
            }

            deletedGuids.add(guid);

            // When the first file is confirmed deleted, delete the rest (without confirmation)
            if (guid === first) {
                rest.forEach(g => deleteInstance.delete(g, false));
            }

            // All deletions done
            if (deletedGuids.size === allGuids.length) {
                document.removeEventListener('vdm.uikit.delete.afterFileDelete', afterDeleteHandler);
                document.dispatchEvent(new CustomEvent('vdm.uikit.delete.afterFilesDelete', { guids: allGuids }));
            }
        };

        // Attach the after delete listener
        document.addEventListener('vdm.uikit.delete.afterFileDelete', afterDeleteHandler);

        document.dispatchEvent(new CustomEvent('vdm.uikit.delete.beforeFirstFileDelete', { guid: first }));

        // Initiate the first deletion (with confirmation)
        deleteInstance.delete(first);
    };

})(window);