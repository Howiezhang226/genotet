var FormData = require('form-data');

var server = require('../server.js');
var chain = require('../chain.js');
var data = require('../data.js');

var dataInfo = {
  name: 'expression-1',
  description: 'the first expression',
  fileName: 'expression-1.tsv'
};

var tests = [
  {
    name: 'upload expression',
    action: function(frisby) {
      var form = new FormData();
      form.append('type', 'expression');
      form.append('name', dataInfo.name);
      form.append('fileName', dataInfo.fileName);
      form.append('description', dataInfo.description);
      var fileInfo = data.getFile('expression', dataInfo.fileName);
      form.append('file', fileInfo.stream, {
        knownLength: fileInfo.size
      });
      server
        .postForm(frisby, form)
        .expectStatus(200);
      return form;
    },
    check: function(body) {
      var json = JSON.parse(body);
      it('upload response is success', function() {
        expect(json.success).toBe(true);
      });
    }
  },
  {
    name: 'list expression',
    action: function(frisby) {
      frisby
        .get(server.queryURL({type: 'list-matrix'}))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('listed expression data', function() {
        expect(data.length).toBe(1);
        expect(data[0]).toEqual({
          matrixName: dataInfo.name,
          fileName: dataInfo.fileName,
          description: dataInfo.description
        });
      });
    }
  },
  {
    name: 'query expression',
    action: function(frisby) {
      frisby
        .get(server.queryURL({
          type: 'expression',
          matrixName: dataInfo.name,
          geneRegex: 'a|b',
          conditionRegex: '1|2'
        }))
        .expectStatus(200);
    },
    check: function(body) {
      var data = JSON.parse(body);
      it('gene names', function() {
        expect(data.geneNames).toEqual(['a', 'b']);
      });
      it('condition names', function() {
        expect(data.conditionNames).toEqual(['cond1', 'cond2']);
      });
      it('values', function() {
        expect(data.values).toEqual([[1, 2], [4, 5]]);
      });
      it('min/max values', function() {
        expect(data.valueMin).toBe(1);
        expect(data.valueMax).toBe(5);
        expect(data.allValueMin).toBe(-1);
        expect(data.allValueMax).toBe(9);
      });
    }
  }
];
chain.test(tests);
