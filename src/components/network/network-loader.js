/**
 * @fileoverview Gene regulatory network data loader.
 */

'use strict';

/**
 * NetworkLoader loads the gene regulatory network data.
 * @param {!Object} data Data object to be written.
 * @extends {genotet.ViewLoader}
 * @constructor
 */
genotet.NetworkLoader = function(data) {
  genotet.NetworkLoader.base.constructor.call(this, data);
};

genotet.utils.inherit(genotet.NetworkLoader, genotet.ViewLoader);

/**
 * Loads the network data, adding the genes given by geneRegex.
 * @param {string} fileName Network File name.
 * @param {string} inputGenes The input genes.
 * @param {boolean} isRegex Whether inputGene is regex.
 * @override
 */
genotet.NetworkLoader.prototype.load = function(fileName, inputGenes, isRegex) {
  var genes = this.prepareGene_(inputGenes, isRegex);
  this.data.genes = genes;
  this.loadNetwork_(fileName, genes);
};

/**
 * Prepares gene array for the input gene string and isRegex.
 * @param {string} inputGenes Input string for genes.
 * @param {boolean} isRegex If inputGene is regex.
 * @return {!Array<string>}
 * @private
 */
genotet.NetworkLoader.prototype.prepareGene_ = function(inputGenes, isRegex) {
  var genes = [];
  if (isRegex) {
    var regex;
    try {
      regex = RegExp(inputGenes, 'i');
    } catch (e) {
      genotet.error('invalid gene regex', inputGenes);
      return [];
    }
    this.data.networkInfo.nodes.forEach(function(node) {
      if (node.id.match(regex)) {
        genes.push(node.id);
      }
    });
  } else {
    genes = inputGenes.replace(' ', '').split(',');
  }
  return genes;
};

/**
 * Gets the network info.
 * @param {string} fileName File name of the network.
 */
genotet.NetworkLoader.prototype.loadNetworkInfo = function(fileName) {
  var params = {
    type: 'network-info',
    fileName: fileName
  };
  this.get(genotet.data.serverURL, params, function(data) {
    this.data.networkInfo = data;
    this.signal('infoLoaded');
  }.bind(this), 'cannot load network info');
};

/**
 * Implements the network loading ajax call.
 * @param {string} fileName File Name of the network.
 * @param {!Array<string>} genes Genes that selects the gene set.
 * @private
 */
genotet.NetworkLoader.prototype.loadNetwork_ = function(fileName, genes) {
  var params = {
    type: 'network',
    fileName: fileName,
    genes: genes
  };

  this.get(genotet.data.serverURL, params, function(data) {
    if (!genes.length) {
      genotet.warning('input gene not found');
      return;
    }
    // Store the last applied fileName and genes.
    _.extend(data, {
      fileName: fileName,
      genes: genes
    });
    this.data.network = data;
  }.bind(this), 'cannot load network');
};

/**
 * Updates the genes in the current network.
 * @param {string} method Update method, either 'set' or 'add'.
 * @param {string} inputGenes Genes that selects the genes to be updated.
 * @param {boolean} isRegex Whether update is based on regex.
 */
genotet.NetworkLoader.prototype.updateGenes = function(method, inputGenes,
                                                       isRegex) {
  var genes = this.prepareGene_(inputGenes, isRegex);
  if (!genes.length) {
    genotet.warning('no genes found');
    return;
  }

  switch (method) {
    case 'set':
      this.loadNetwork_(this.data.network.fileName, genes);
      break;
    case 'add':
      this.addGenes_(genes);
      break;
    case 'remove':
      this.deleteGenes_(genes);
      this.signal('hideNode', {
        genes: genes
      });
      break;
  }
};

/**
 * Fetches the incident edges of a given node.
 * @param {!genotet.NetworkNode} node Node of which the incident
 * edges are queried.
 */
genotet.NetworkLoader.prototype.incidentEdges = function(node) {
  var params = {
    type: 'incident-edges',
    fileName: this.data.network.fileName,
    gene: node.id
  };
  this.get(genotet.data.serverURL, params, function(data) {
    this.data.incidentEdges = data;
    this.signal('incidentEdges');
  }.bind(this), 'cannot get incident edges');
};

/**
 * Adds genes to the network, and the edges to the original graph.
 * @param {!Array<string>} genes Names of the genes.
 * @private
 */
genotet.NetworkLoader.prototype.addGenes_ = function(genes) {
  var oldGenes = {};
  this.data.network.nodes.forEach(function(node) {
    oldGenes[node.id] = true;
  });
  var newGenes = [];
  newGenes = genes.filter(function(gene) {
    return !(gene in oldGenes);
  });

  if (!newGenes.length) {
    genotet.warning('genes are already in the network');
    return;
  }

  var params = {
    type: 'incremental-edges',
    fileName: this.data.network.fileName,
    genes: newGenes,
    nodes: this.data.network.nodes
  };

  this.get(genotet.data.serverURL, params, function(data) {
    var isTF = {};
    this.data.networkInfo.nodes.forEach(function(node) {
      isTF[node.id] = node.isTF;
    });
    this.data.network.nodes = this.data.network.nodes
      .concat(newGenes.map(function(gene) {
      return {
        id: gene,
        label: gene,
        isTF: isTF[gene]
      };
    }));
    this.data.network.edges = this.data.network.edges.concat(data.edges);
  }.bind(this), 'cannot add genes');
};

/**
 * Deletes genes from graph and related edges.
 * @param {!Array<string>} genes Names of the genes.
 * @private
 */
genotet.NetworkLoader.prototype.deleteGenes_ = function(genes) {
  var geneMap = genotet.utils.keySet(genes);
  // delete the nodes
  this.data.network.nodes = this.data.network.nodes.filter(function(node) {
    return !(node.id in geneMap);
  });
  // delete the edges
  this.data.network.edges = this.data.network.edges.filter(function(edge) {
    return !(edge.source in geneMap) && !(edge.target in geneMap);
  });
};

/**
 * Adds edges to the network.
 * @param {!Array<!genotet.NetworkEdge>} edges Edges to be add into network.
 */
genotet.NetworkLoader.prototype.addEdges = function(edges) {
  edges.forEach(function(edge) {
    var source = edge.source;
    var target = edge.target;
    var weight = edge.weight;
    var sourceExists = false, targetExists = false;
    this.data.network.nodes.forEach(function(node) {
      if (source == node.id) {
        sourceExists = true;
      }
      if (target == node.id) {
        targetExists = true;
      }
    });
    if (!sourceExists) {
      this.data.network.nodes.push({
        id: source,
        label: source,
        isTF: true
      });
    }
    if (!targetExists) {
      var isTF = false;
      this.data.networkInfo.nodes.forEach(function(node) {
        if (target == node.id) {
          isTF = node.isTF;
        }
      });
      this.data.network.nodes.push({
        id: target,
        label: target,
        isTF: isTF
      });
    }
    this.data.network.edges.push({
      id: source + ',' + target,
      source: source,
      target: target,
      weight: weight
    });
  }, this);
};

/**
 * Deletes edges from the network.
 * @param {!Array<!genotet.NetworkEdge>} edges Edges to be deleted.
 */
genotet.NetworkLoader.prototype.deleteEdges = function(edges) {
  var edgeMap = {};
  edges.forEach(function(edge) {
    edgeMap[edge.id] = true;
  });
  console.log(this.data.network.edges);
  for (var i = this.data.network.edges.length - 1; i >= 0; i--) {
    if (this.data.network.edges[i].id in edgeMap) {
      this.data.network.edges.splice(i, 1);
    }
  }
};

/*
LoaderGraph.prototype.loadComb = function(net, exp) {
    var loader = this;
  var oexp = exp;
  exp = utils.encodeSpecialChar(exp);
  $.ajax({
    type: 'GET', url: addr, dataType: 'jsonp',
    data: {
      args: 'type=comb&net=' + net + '&exp=' + exp
    },
    success: function(result) {
      var data = JSON.parse(result, Utils.parse);
        if (data.length == 0) {
        options.alert('There is no common targets.');
        return;
      }
      var addexp = 'a^';
      for (var i = 0; i < data.length; i++) addexp += '|^'+ data[i] + '$';
      //console.log(oexp);
      addexp += '|'+ oexp;
      loader.addNodes(addexp);
    }
  });
};
*/
