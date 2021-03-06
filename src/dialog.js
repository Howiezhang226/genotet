/**
 * @fileoverview Genotet dialog (modal) specification.
 */

'use strict';

/** @const */
genotet.dialog = {};

/**
 * Gene input type that is regex or string.
 * @private {boolean}
 */
genotet.dialog.isGeneRegex_ = false;

/**
 * Condition input type that is regex or string.
 * @private {boolean}
 */
genotet.dialog.isConditionRegex_ = false;

/**
 * Length of time interval for queries of uploading result, in milliseconds.
 * @private {number}
 */
genotet.dialog.queryInterval_ = 3 * 1000;

/**
 * Template paths.
 * @private {!Object<string>}
 */
genotet.dialog.TEMPLATES_ = {
  organism: 'dist/html/organism.html',
  view: 'dist/html/create-view.html',
  network: 'templates/create-network.html',
  binding: 'templates/create-binding.html',
  expression: 'templates/create-expression.html',
  mapping: 'templates/mapping.html',
  about: 'templates/about.html',
  upload: 'templates/upload.html',
  progress: 'templates/upload-progress.html'
};

/**
 * Creates a dialog with the given parameter.
 * @param {string} type Type of the dialog.
 */
genotet.dialog.create = function(type) {
  if (type == null) {
    console.error('undefined dialog type in create');
    return;
  }
  switch (type) {
    case 'create-view':
      genotet.dialog.createView_();
      break;
    case 'create-network':
      genotet.dialog.createNetwork_();
      break;
    case 'create-binding':
      genotet.dialog.createBinding_();
      break;
    case 'create-expression':
      genotet.dialog.createExpression_();
      break;
    case 'organism':
      genotet.dialog.organism_();
      break;
    case 'mapping':
      genotet.dialog.mapping_();
      break;
    case 'about':
      genotet.dialog.about_();
      break;
    case 'upload':
      genotet.dialog.upload_();
      break;
    default:
      genotet.error('unknown view type in Dialog.create:', type);
      break;
  }
};

/**
 * Creates a organism selection dialog.
 * @private
 */
genotet.dialog.organism_ = function() {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.organism,
    function() {
      modal.modal();
      modal.find('.btn-organism').removeClass('active')
        .click(function() {
          genotet.data.organism = /** @type {string} */($(this).attr('id'));
          modal.find('.btn-organism').removeClass('active');
          $(this).addClass('active');
        });
      modal.find('#' + genotet.data.organism).addClass('active');
    });
};

/**
 * Creates a dialog for view creation.
 * @private
 */
genotet.dialog.createView_ = function() {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.view, function() {
    modal.modal();
    modal.find('#type').select2();
    modal.find('#btn-next').click(function() {
      var type = /** @type {string} */(modal.find('#type').val());
      switch (type) {
      case genotet.ViewType.NETWORK:
        genotet.dialog.create('create-network');
        break;
      case genotet.ViewType.BINDING:
        genotet.dialog.create('create-binding');
        break;
      case genotet.ViewType.EXPRESSION:
        genotet.dialog.create('create-expression');
        break;
      default:
        genotet.error('unknown view type in Dialog.createView:', type);
        break;
      }
    });
  });
};

/**
 * Creates a dialog for network creation.
 * @private
 */
genotet.dialog.createNetwork_ = function() {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.network,
    function() {
      modal.modal();
      var viewName = modal.find('#view-name');
      viewName.val(genotet.viewManager.nextSuffixName(
        /** @type {string} */(viewName.val())));

      // Load network list.
      var fileNames = [];
      var params = {
        type: genotet.data.ListQueryType.NETWORK
      };
      $.get(genotet.data.serverURL, params, function(data) {
          data.forEach(function(networkFile) {
              fileNames.push({
                id: networkFile.fileName,
                text: networkFile.networkName + ' (' +
                networkFile.fileName + ')'
              });
          });
          modal.find('#network').select2({
            data: fileNames
          });
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get network list');
        });

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = /** @type {string} */(modal.find('#view-name').val());
        var isRegex = modal.find('#gene-input-type')
          .children('label[name=regex]').children('input').prop('checked');
        genotet.viewManager.createView(genotet.ViewType.NETWORK, viewName, {
          fileName: modal.find('#network').val(),
          inputGenes: modal.find('#geneRegex').val(),
          isRegex: isRegex
        });
      });
    });
};

/**
 * Creates a dialog for genome browser creation.
 * @private
 */
genotet.dialog.createBinding_ = function() {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.binding,
    function() {
      modal.modal();
      var viewName = modal.find('#view-name');
      viewName.val(genotet.viewManager.nextSuffixName(
        /** @type {string} */(viewName.val())));

      var chrs = genotet.data.bindingChrs.map(function(chr, index) {
        return {
          id: chr,
          text: chr
        };
      });
      modal.find('#chr').select2({
        data: chrs
      });

      // Load binding list.
      var fileNames = [];
      var params = {
        type: genotet.data.ListQueryType.BINDING
      };
      $.get(genotet.data.serverURL, params, function(data) {
          data.forEach(function(bindingFile) {
            fileNames.push({
              id: bindingFile.fileName,
              text: bindingFile.gene + ' (' + bindingFile.fileName + ')'
            });
          });
          modal.find('#gene').select2({
            data: fileNames
          });
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get binding list');
        });

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = /** @type {string} */(modal.find('#view-name').val());
        genotet.viewManager.createView(genotet.ViewType.BINDING, viewName, {
          fileNames: modal.find('#gene').val(),
          bedName: genotet.data.bedName,
          chr: modal.find('#chr').val(),
          multipleTracks: false
        });
      });
    });
};

/**
 * Creates a dialog for expression matrix creation.
 * @private
 */
genotet.dialog.createExpression_ = function() {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.expression,
    function() {
      modal.modal();
      var viewName = modal.find('#view-name');
      viewName.val(genotet.viewManager.nextSuffixName(
        /** @type {string} */(viewName.val())));

      // Choose input type of gene and condition.
      modal.find('#gene-input-type label[name=regex] input')
        .on('click', function() {
          genotet.dialog.isGeneRegex_ = true;
        });
      modal.find('#gene-input-type label[name=string] input')
        .on('click', function() {
          genotet.dialog.isGeneRegex_ = false;
        });
      modal.find('#condition-input-type label[name=regex] input')
        .on('click', function() {
          genotet.dialog.isConditionRegex_ = true;
        });
      modal.find('#condition-input-type label[name=string] input')
        .on('click', function() {
          genotet.dialog.isConditionRegex_ = false;
        });

      // Load expression list.
      var fileNames = [];
      var params = {
        type: genotet.data.ListQueryType.EXPRESSION
      };
      $.get(genotet.data.serverURL, params, function(data) {
          data.forEach(function(expressionFile) {
              fileNames.push({
                id: expressionFile.fileName,
                text: expressionFile.matrixName + ' (' +
                expressionFile.fileName + ')'
              });
          });
          modal.find('#matrix').select2({
            data: fileNames
          });
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get expression list');
        });

      // Create
      modal.find('#btn-create').click(function() {
        var viewName = /** @type {string} */(modal.find('#view-name').val());
        var geneInput = modal.find('#gene-input').val();
        var conditionInput = modal.find('#cond-input').val();
        genotet.viewManager.createView(genotet.ViewType.EXPRESSION, viewName, {
          fileName: modal.find('#matrix').val(),
          tfaFileName: genotet.data.tfaFileName,
          isGeneRegex: genotet.dialog.isGeneRegex_,
          isConditionRegex: genotet.dialog.isConditionRegex_,
          geneInput: geneInput,
          conditionInput: conditionInput
        });
      });
    });
};

/**
 * Shows a dialog for the user to choose mapping files for linked queries.
 * @private
 */
genotet.dialog.mapping_ = function() {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.mapping,
    function() {
      modal.modal();

      // Load mapping list.
      var fileNames = [];
      var params = {
        type: genotet.data.ListQueryType.MAPPING
      };
      $.get(genotet.data.serverURL, params, function(data) {
          data.forEach(function(fileName) {
            fileNames.push({
              id: fileName,
              text: fileName
            });
          });
          fileNames.push('Direct Mapping');
          modal.find('#mapping-file').select2({
            data: fileNames
          })
            .val(genotet.data.mappingFiles['gene-binding'])
            .trigger('change');
        }.bind(this), 'jsonp')
        .fail(function() {
          genotet.error('failed to get mapping list');
        });

      // Create
      modal.find('#btn-choose').click(function() {
        var fileName = modal.find('#mapping-file').val();
        genotet.data.mappingFiles['gene-binding'] =
        /** @type {string} */(fileName);
      });
    });
};

/**
 * Shows a dialog for the version information.
 * @private
 */
genotet.dialog.about_ = function() {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.about,
    function() {
      modal.modal();
    });
};

/**
 * Creates a dialog for uploading data.
 * @private
 */
genotet.dialog.upload_ = function() {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.upload,
    function() {
      // Because we don't destroy the modal, we make it static at first.
      // It needs to be static as a progress bar.
      modal.modal({
        backdrop: 'static',
        keyboard: false
      });
      var typeSelection = modal.find('#type');
      typeSelection.select2();

      var file = modal.find('#file');
      var dataName = modal.find('#data-name');

      var btnUpload = modal.find('#btn-upload').prop('disabled', true);
      var btnFile = modal.find('#btn-file');
      var fileDisplay = modal.find('#file-display');

      typeSelection.on('change', function() {
        var isMapping = /** @type {string} */(typeSelection.val()) ==
          genotet.FileType.MAPPING;
        if (isMapping) {
          modal.find('#data-name').closest('tr').css('display', 'none');
          modal.find('#description').closest('tr').css('display', 'none');
        } else {
          modal.find('#data-name').closest('tr').css('display', '');
          modal.find('#description').closest('tr').css('display', '');
        }
      });

      btnFile.click(function() {
        file.trigger('click');
      });
      fileDisplay.click(function() {
        file.trigger('click');
      });

      // Checks if all required fields are filled.
      var uploadReady = function() {
        return file.val() && (dataName.val() ||
          typeSelection.val() == genotet.FileType.MAPPING);
      };

      var fileName;
      file.change(function(event) {
        fileName = event.target.files[0].name;
        fileDisplay.text(fileName);
        btnUpload.prop('disabled', !uploadReady());
      });

      btnUpload.click(function() {
        var formData = new FormData();
        var fileType = /** @type {string} */(modal.find('#type').val());
        formData.append('type', fileType);
        formData.append('name',
          /** @type {string} */(dataName.val()));
        formData.append('description',
          /** @type {string} */(modal.find('#description').val()));
        formData.append('file', file[0].files[0]);

        $.ajax({
          url: genotet.data.uploadURL,
          type: 'POST',
          data: formData,
          enctype: 'multipart/form-data',
          processData: false,
          contentType: false
        }).done(function(data) {
            if (!data.success) {
              genotet.error('failed to upload data', data.message);
            } else {
              genotet.success('data uploaded');
            }
          })
          .fail(function(res) {
            genotet.error('failed to upload data');
          });
        genotet.dialog.uploadProgress_(fileName);
      });
    });
};

/**
 * Creates a dialog for uploading progress.
 * @param {string} fileName File name of the upload file.
 * @private
 */
genotet.dialog.uploadProgress_ = function(fileName) {
  var modal = $('#dialog');
  modal.find('.modal-content').load(genotet.dialog.TEMPLATES_.progress,
    function() {
      modal.modal();
      var number = 0;
      modal.find('#btn-ok').prop('disabled', true);
      var interval = setInterval(function() {
        number++;
        // This is a fake progress bar.
        // Increase 3% for the progress bar every 3 seconds.
        // When reaching 99, do not increase it any more.
        var widthPercent = Math.min(number * 3, 99) + '%';
        var params = {
          type: 'check-finish',
          fileName: fileName
        };
        $.get(genotet.data.serverURL, params, function(data) {
          if (data) {
            clearInterval(interval);
            widthPercent = '100%';
            modal.find('#btn-ok').prop('disabled', false);
            modal.find('.progress').children('.progress-bar')
              .css('width', widthPercent);
          }
        }, 'jsonp');
        modal.find('.progress').children('.progress-bar')
          .css('width', widthPercent);
      }, genotet.dialog.queryInterval_);
    });
};
