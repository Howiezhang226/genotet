/**
 * @fileoverview Renderer of the ExpressionView.
 */

'use strict';

/**
 * ExpressionRenderer renders the visualizations for the ExpressionView.
 * @param {!jQuery} container View container.
 * @param {!Object} data Data object to be written.
 * @extends {genotet.ViewRenderer}
 * @constructor
 */
genotet.ExpressionRenderer = function(container, data) {
  genotet.ExpressionRenderer.base.constructor.call(this, container, data);

  /** @protected {genotet.ExpressionMatrix} */
  this.data.matrix;

  /**
   * Gene profile data. Each element corresponds to one gene profile line.
   * @protected {!Array<!genotet.ExpressionRenderer.Profile>}
   */
  this.data.profiles;

  /**
   * The maximum width of the horizontal gene labels.
   * This value will be zero when gene labels are not shown.
   * @private {number}
   */
  this.geneLabelWidth_ = 0;

  /**
   * The maximum height of the vertical experiment condition labels.
   * This value will be zero when condition labels are not shown.
   * @private {number}
   */
  this.conditionLabelHeight_ = 0;

  /**
   * Height of the gene profile plot.
   * This value will be zero when profiles are not shown.
   * @private {number}
   */
  this.profileHeight_ = this.DEFAULT_PROFILE_HEIGHT;

  /**
   * Width of the heatmap.
   * @private {number}
   */
  this.heatmapWidth_ = 0;

  /**
   * Height of the heatmap.
   * @private {number}
   */
  this.heatmapHeight_ = 0;

  /**
   * Clicked object for heatmap cells and gene profiles.
   * @private {!genotet.ExpressionRenderer.Cell|!Object}
   */
  this.clickedObject_ = {};

  /**
   * Margins of the gene profile.
   * @private {!Object<number>}
   */
  this.profileMargins_ = {
    top: 10,
    right: 0,
    bottom: 10,
    left: 40
  };

  /**
   * Margins of the heatmap gradient.
   * @private @const {!Object<number>}
   */
  this.HEATMAP_GRADIENT_MARGINS_ = {
    TOP: 5,
    RIGHT: 40,
    BOTTOM: 5,
    LEFT: 40
  };
};

genotet.utils.inherit(genotet.ExpressionRenderer, genotet.ViewRenderer);

/**
 * Cell object storing the rendering properties of expression cell.
 * @param {!{
 *   container: (?Element|undefined),
 *   geneName: (?string|undefined),
 *   conditionName: (?string|undefined),
 *   row: (?number|undefined),
 *   column: (?number|undefined),
 *   value: (?number|undefined),
 *   colorscaleValue: (?string|undefined)
 * }} params
 *     container: Container of the selected expression cell.
 *     geneName: Gene Name of the selected expression cell.
 *     conditionName: Condition Name of the selected expression cell.
 *     row: Row index of the selected expression cell.
 *     column: Column index of the selected expression cell.
 *     value: Value of the selected expression cell.
 *     colorscaleValue: Color of the selected expression cell.
 * @struct
 * @constructor
 */
genotet.ExpressionRenderer.Cell = function(params) {
  /** @type {?Element} */
  this.container = params.container != null ? params.container : null;

  /** @type {?string} */
  this.geneName = params.geneName != null ? params.geneName : null;

  /** @type {?string} */
  this.conditionName = params.conditionName != null ?
    params.conditionName : null;

  /** @type {number} */
  this.row = params.row != null ? params.row : -1;

  /** @type {number} */
  this.column = params.column != null ? params.column : -1;

  /** @type {number} */
  this.value = params.value != null ? params.value : 0;

  /** @type {?string} */
  this.colorscaleValue = params.colorscaleValue != null ?
    params.colorscaleValue : null;
};

/**
 * Profile object storing the rendering properties of expression cell.
 * @param {!{
 *   container: (?Element|undefined),
 *   geneName: (?string|undefined),
 *   row: (?number|undefined),
 *   hoverColumn: (?number|undefined),
 *   hoverConditionName: (?string|undefined),
 *   hoverValue: (?number|undefined),
 *   color: (?string|undefined)
 * }} params
 *      container: Container of the selected gene profile.
 *      geneName: Gene Name of the selected gene profile.
 *      row: Row index of the selected gene profile.
 *      hoverColumn: Column index of the hover gene profile.
 *      hoverConditionName: Condition Name of the hover gene profile.
 *      hoverValue: Value of the hover gene profile.
 *      color: Color of the selected gene profile.
 * @struct
 * @constructor
 */
genotet.ExpressionRenderer.Profile = function(params) {
  /** @type {?Element} */
  this.container = params.container != null ? params.container : null;

  /** @type {?string} */
  this.geneName = params.geneName != null ? params.geneName : null;

  /** @type {number} */
  this.row = params.row != null ? params.row : -1;

  /** @type {number} */
  this.hoverColumn = params.hoverColumn != null ? params.hoverColumn : -1;

  /** @type {?string} */
  this.hoverConditionName = params.hoverConditionName != null ?
    params.hoverConditionName : null;

  /** @type {number} */
  this.hoverValue = params.hoverValue != null ? params.hoverValue : 0;

  /** @type {?string} */
  this.color = params.color != null ? params.color : null;
};

/** @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_HEIGHT = 150;

/** @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_LEGEND_HEIGHT = 25;

/** @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_LEGEND_MARGIN = 10;

/** @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_PROFILE_MARGIN = 40;

/** @const {number} */
genotet.ExpressionRenderer.prototype.DEFAULT_HEATMAP_GRADIENT_HEIGHT = 30;

/** @const {number} */
genotet.ExpressionRenderer.prototype.GENE_LABEL_WIDTH_FACTOR = 8.725;

/** @const {number} */
genotet.ExpressionRenderer.prototype.CONDITION_LABEL_HEIGHT_FACTOR = 6.501175;

/** @const {number} */
genotet.ExpressionRenderer.prototype.LABEL_MARGIN = 10;

/** @const {number} */
genotet.ExpressionRenderer.prototype.LABEL_DIFFERENCE = 10;

/** @const {number} */
genotet.ExpressionRenderer.prototype.HEATMAP_LEGEND_MARGIN = 1;

/** @const {number} */
genotet.ExpressionRenderer.prototype.HEATMAP_GRADIENT_MARGIN = 1;

/** @const {number} */
genotet.ExpressionRenderer.prototype.TEXT_HEIGHT = 9.66;

/** @const {number} */
genotet.ExpressionRenderer.prototype.COLOR_CATEGORY_SIZE = 60;

/** @const {!Array<string>} */
genotet.ExpressionRenderer.prototype.COLOR_CATEGORY = d3.scale.category20()
  .range()
  .concat(d3.scale.category20b().range())
  .concat(d3.scale.category20c().range());

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.init = function() {
  genotet.ExpressionRenderer.base.init.call(this);
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.initLayout = function() {
  /**
   * SVG group for profile plot (line charts).
   * @private {!d3}
   */
  this.svgProfile_ = this.canvas.append('g')
    .classed('profiles', true)
    .classed('height', this.DEFAULT_PROFILE_HEIGHT);

  /**
   * SVG group for profile legend.
   * @private {!d3}
   */
  this.svgLegend_ = this.svgProfile_.append('g')
    .classed('legend', true);

  /**
   * SVG group for profile x axis.
   * @private {!d3}
   */
  this.svgProfileXAxis_ = this.svgProfile_.append('g')
    .classed('x axis', true);

  /**
   * SVG group for profile y axis.
   * @private {!d3}
   */
  this.svgProfileYAxis_ = this.svgProfile_.append('g')
    .classed('axis', true);

  /**
   * SVG group for profile content.
   * @private {!d3}
   */
  this.profileContent_ = this.svgProfile_.append('g')
    .classed('profile-content', true);

  /**
   * SVG group for the heatmap plot.
   * @private {!d3}
   */
  this.svgHeatmap_ = this.canvas.append('g')
    .classed('heatmap', true);

  /**
   * SVG group for the heatmap itself.
   * @private {!d3}
   */
  this.svgHeatmapContent_ = this.svgHeatmap_.append('g')
    .classed('content', true);

  /**
   * SVG group for the heatmap gene (row) labels.
   * @private {!d3}
   */
  this.svgGeneLabels_ = this.svgHeatmap_.append('g')
    .classed('gene-labels', true);

  /**
   * SVG group for the heatmap condition (column) labels.
   * @private {!d3}
   */
  this.svgConditionLabels_ = this.svgHeatmap_.append('g')
    .classed('condition-labels', true);

  /**
   * SVG group for the heatmap gradient.
   * @private {!d3}
   */
  this.svgHeatmapGradient_ = this.svgHeatmap_.append('g')
    .classed('heatmap-gradient', true);

  /**
   * SVG defs for the heatmap gradient.
   * @private {!d3}
   */
  this.gradientContent_ = this.svgHeatmapGradient_.append('defs')
    .append('linearGradient')
    .attr('id', 'gradient-content')
    .attr('x2', '100%')
    .attr('spreadMethod', 'pad');
  this.gradientContent_.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', genotet.data.redYellowScale[0])
    .attr('stop-opacity', 1);
  this.gradientContent_.append('stop')
    .attr('offset', '50%')
    .attr('stop-color', genotet.data.redYellowScale[1])
    .attr('stop-opacity', 1);
  this.gradientContent_.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', genotet.data.redYellowScale[2])
    .attr('stop-opacity', 1);

  /**
   * SVG rect for the heatmap gradient.
   * @private {!d3}
   */
  this.gradientRect_ = this.svgHeatmapGradient_.append('rect')
    .classed('gradient-rect', true)
    .style('fill', 'url(#gradient-content)');

  /**
   * SVG text for the heatmap gradient.
   */
  this.svgHeatmapGradient_.append('text')
    .classed('gradient-text-left', true);
  this.svgHeatmapGradient_.append('text')
    .classed('gradient-text-right', true);
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.layout = function() {
  // Gets the label sizes so as to set the offset of heatmap SVG.
  this.getHeatmapLabelSizes_();
  // Compute the shifting sizes.
  this.profileHeight_ = this.data.options.showProfiles ?
    this.DEFAULT_PROFILE_HEIGHT : 0;

  this.heatmapLayout_();
  this.profileLayout_();
};

/**
 * Layout of the expression heatmap.
 * @private
 */
genotet.ExpressionRenderer.prototype.heatmapLayout_ = function() {
  this.heatmapWidth_ = this.canvasWidth;
  if (this.data.options.showGeneLabels) {
    this.heatmapWidth_ -= this.LABEL_MARGIN + this.geneLabelWidth_;
  } else if (this.data.options.showProfiles) {
    this.heatmapWidth_ -= this.DEFAULT_PROFILE_MARGIN;
  }
  this.heatmapHeight_ = this.canvasHeight -
    this.profileHeight_ - this.DEFAULT_HEATMAP_GRADIENT_HEIGHT;
  if (this.data.options.showConditionLabels) {
    this.heatmapHeight_ -= this.conditionLabelHeight_ +
      this.LABEL_MARGIN + this.LABEL_DIFFERENCE;
  }

  var heatmapData = this.data.matrix;
  this.cellWidth = this.heatmapWidth_ / heatmapData.conditionNames.length;
  this.cellHeight = this.heatmapHeight_ / heatmapData.geneNames.length;

  var heatmapTransformLeft = this.geneLabelWidth_;
  var heatmapTransformTop = this.profileHeight_;
  if (this.data.options.showGeneLabels) {
    heatmapTransformLeft += this.LABEL_MARGIN;
  } else if (this.data.options.showProfiles) {
    heatmapTransformLeft += this.DEFAULT_PROFILE_MARGIN;
  }
  if (this.data.options.showConditionLabels) {
    heatmapTransformTop += this.conditionLabelHeight_ +
      this.LABEL_MARGIN + this.LABEL_DIFFERENCE;
  }
  this.svgHeatmapContent_
    .attr('transform', genotet.utils.getTransform([
      heatmapTransformLeft,
      heatmapTransformTop
    ]));

  var geneLabelTransformTop = this.profileHeight_ + this.TEXT_HEIGHT / 2 +
    this.cellHeight / 2;
  if (this.data.options.showConditionLabels) {
    geneLabelTransformTop += this.conditionLabelHeight_ +
      this.LABEL_MARGIN + this.LABEL_DIFFERENCE;
  }
  this.svgGeneLabels_
    .attr('transform', genotet.utils.getTransform([
      this.geneLabelWidth_,
      geneLabelTransformTop
    ]));

  var conditionLabelTransformLeft = this.geneLabelWidth_ +
    this.TEXT_HEIGHT / 2 + this.cellWidth / 2;
  if (this.data.options.showGeneLabels) {
    conditionLabelTransformLeft += this.LABEL_MARGIN;
  } else if (this.data.options.showProfiles) {
    conditionLabelTransformLeft += this.DEFAULT_PROFILE_MARGIN;
  }
  this.svgConditionLabels_
    .attr('transform', genotet.utils.getTransform([
      conditionLabelTransformLeft,
      this.conditionLabelHeight_ + this.profileHeight_ + this.LABEL_MARGIN
    ]));

  var heatmapGradientTransformLeft = 0;
  var heatmapGradientTransformTop = this.heatmapHeight_;
  if (this.data.options.showProfiles) {
    heatmapGradientTransformTop += this.profileHeight_;
  }
  if (this.data.options.showGeneLabels) {
    heatmapGradientTransformLeft += this.geneLabelWidth_ + this.LABEL_MARGIN;
  } else if (this.data.options.showProfiles) {
    heatmapGradientTransformLeft += this.DEFAULT_PROFILE_MARGIN;
  }
  if (this.data.options.showConditionLabels) {
    heatmapGradientTransformTop += this.conditionLabelHeight_ +
      this.LABEL_MARGIN + this.LABEL_DIFFERENCE;
  }
  this.svgHeatmapGradient_.attr('transform', genotet.utils.getTransform([
    heatmapGradientTransformLeft,
    heatmapGradientTransformTop
  ]));
};

/**
 * Layout of the gene profile.
 * @private
 */
genotet.ExpressionRenderer.prototype.profileLayout_ = function() {
  this.profileContent_
    .attr('width', this.canvasWidth - this.profileMargins_.left -
      this.profileMargins_.right)
    .attr('height', this.profileHeight_ - this.profileMargins_.top -
      this.profileMargins_.bottom);

  if (this.data.options.showProfiles) {
    if (!this.data.options.showGeneLabels) {
      this.profileMargins_.left = this.DEFAULT_PROFILE_MARGIN;
    } else {
      this.profileMargins_.left = this.geneLabelWidth_ + this.LABEL_MARGIN;
    }
  }
  this.svgLegend_
    .attr('transform', genotet.utils.getTransform([
      this.profileMargins_.left,
      this.DEFAULT_PROFILE_LEGEND_MARGIN
    ]));
  this.svgProfileXAxis_
    .attr('transform', genotet.utils.getTransform([
      0,
      this.profileHeight_ - this.profileMargins_.bottom
    ]));
  this.svgProfileYAxis_
    .attr('transform', genotet.utils.getTransform([
      this.profileMargins_.left,
      0
    ]));
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.dataLoaded = function() {
  var heatmapData = this.data.matrix;
  var i = 0;
  var profileCount = this.data.profiles.length;
  while (i < profileCount) {
    var geneIndex = heatmapData.geneNames.indexOf(
      this.data.profiles[i].geneName);
    if (geneIndex == -1) {
      this.data.profiles.splice(i, 1);
      profileCount--;
    } else {
      this.data.profiles[i].row = geneIndex;
      i++;
    }
  }

  this.render();
  this.highlightLabelsAfterUpdateData_();
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.dataReady = function() {
  return this.data.matrix != null;
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.render = function() {
  if (!this.dataReady()) {
    return;
  }
  // First layout out the SVG groups based on the current visibility
  // of heatmap and gene profiles.
  this.layout();

  this.drawExpressionMatrix_();
  this.drawGeneProfiles_();
};

/**
 * Renders the expression matrix onto the scene.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawExpressionMatrix_ = function() {
  this.drawMatrixGeneLabels_();
  this.drawMatrixConditionLabels_();
  this.drawHeatmapGradient_();
  this.drawMatrixCells_();
};

/**
 * Renders the expression matrix cells.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawMatrixCells_ = function() {
  var heatmapData = this.data.matrix;
  var colorScale = d3.scale.linear();
  if (this.data.options.autoScaleGradient) {
    colorScale
      .domain([
        heatmapData.valueMin,
        (heatmapData.valueMin + heatmapData.valueMax) / 2,
        heatmapData.valueMax
      ])
      .range(genotet.data.redYellowScale);
  } else {
    colorScale
      .domain([
        heatmapData.allValueMin,
        (heatmapData.allValueMin + heatmapData.allValueMax) / 2,
        heatmapData.allValueMax
      ])
      .range(genotet.data.redYellowScale);
  }

  var heatmapRows = this.svgHeatmapContent_.selectAll('g')
    .data(heatmapData.values);
  heatmapRows.enter().append('g');
  heatmapRows.exit().remove();
  var heatmapRects = heatmapRows.selectAll('rect').data(_.identity);
  heatmapRects.enter().append('rect');
  heatmapRects
    .classed('cell', true)
    .attr('width', this.cellWidth)
    .attr('height', this.cellHeight)
    .attr('x', function(value, i) {
      return i * this.cellWidth;
    }.bind(this))
    .attr('y', function(value, i, j) {
      return j * this.cellHeight;
    }.bind(this))
    .style('stroke', colorScale)
    .style('fill', colorScale)
    .on('mouseover', function(value, i, j) {
      var hoverCell = d3.event.target;
      var cell = new genotet.ExpressionRenderer.Cell({
        container: hoverCell,
        geneName: heatmapData.geneNames[j],
        conditionName: heatmapData.conditionNames[i],
        row: j,
        column: i,
        value: value
      });
      this.signal('cellHover', cell);
    }.bind(this))
    .on('mouseout', function(value) {
      var hoverCell = d3.event.target;
      var cell = new genotet.ExpressionRenderer.Cell({
        container: hoverCell,
        colorscaleValue: colorScale(value)
      });
      this.signal('cellUnhover', cell);
    }.bind(this))
    .on('click', function(value, i, j) {
      var hoverCell = d3.event.target;
      _.extend(this.clickedObject_, {
        container: hoverCell,
        geneName: heatmapData.geneNames[j],
        conditionName: heatmapData.conditionNames[i],
        row: j,
        column: i,
        value: value
      });
      this.signal('expressionClick', this.clickedObject_);
    }.bind(this));
  heatmapRects.exit().remove();

  // Zoom selection.
  var cellWidth = this.cellWidth;
  var cellHeight = this.cellHeight;
  var columnStart, columnEnd, rowStart, rowEnd;
  var selected = false;

  var zoomSelection = this.svgHeatmapContent_
    .on('mousedown', function() {
      var mousePosition = d3.mouse(this);
      zoomSelection.append('rect')
        .classed('selection', true)
        .attr({
          x: mousePosition[0],
          y: mousePosition[1],
          width: 1,
          height: 1
        });
    })
    .on('mousemove', function() {
      var rectSelection = zoomSelection.select('rect.selection');
      if (!rectSelection.empty()) {
        var mousePosition = d3.mouse(this);
        var selectedRange = {
          height: parseInt(rectSelection.attr('height'), 10),
          width: parseInt(rectSelection.attr('width'), 10),
          x: parseInt(rectSelection.attr('x'), 10),
          y: parseInt(rectSelection.attr('y'), 10)
        };
        var selectedBorderWeight = {
          x: mousePosition[0] - selectedRange.x,
          y: mousePosition[1] - selectedRange.y
        };

        if (selectedBorderWeight.x < 1 ||
          (selectedBorderWeight.x * 2 < selectedRange.width)) {
          selectedRange.x = mousePosition[0];
          selectedRange.width -= selectedBorderWeight.x;
        } else {
          selectedRange.width = selectedBorderWeight.x;
        }

        if (selectedBorderWeight.y < 1 ||
          (selectedBorderWeight.y * 2 < selectedRange.height)) {
          selectedRange.y = mousePosition[1];
          selectedRange.height -= selectedBorderWeight.y;
        } else {
          selectedRange.height = selectedBorderWeight.y;
        }
        rectSelection.attr(selectedRange);

        d3.selectAll('.cell-selected').classed('cell-selected', false);
        d3.selectAll('.label-selected').classed('label-selected', false);

        rowStart = Math.floor(selectedRange.y / cellHeight);
        rowEnd = Math.floor((selectedRange.y + selectedRange.height) /
          cellHeight);
        columnStart = Math.floor(selectedRange.x / cellWidth);
        columnEnd = Math.floor((selectedRange.x + selectedRange.width) /
          cellWidth);
        for (var i = rowStart; i <= rowEnd; i++) {
          d3.select('.gene-labels text:nth-of-type(' + (i + 1) + ')')
            .classed('label-selected', true);
        }
        for (var i = columnStart; i <= columnEnd; i++) {
          d3.select('.condition-labels text:nth-of-type(' + (i + 1) + ')')
            .classed('label-selected', true);
        }
        selected = true;
      }
    })
    .on('mouseup', function() {
      zoomSelection.select('rect.selection').remove();
      d3.selectAll('.gene-label').classed('label-selected', false);
      d3.selectAll('.condition-label').classed('label-selected', false);
      if (selected) {
        var zoomParams = {
          rowStart: rowStart,
          rowEnd: rowEnd,
          columnStart: columnStart,
          columnEnd: columnEnd
        };
        var zoomRegex = this.zoomDataLoaded_(zoomParams);
        var currentRegex = {
          matrixName: heatmapData.matrixname,
          geneRegex: heatmapData.geneRegex,
          conditionRegex: heatmapData.conditionRegex,
          geneNames: heatmapData.geneNames,
          conditionNames: heatmapData.conditionNames
        };
        this.data.zoomStack.push(currentRegex);
        this.signal('expressionZoomIn', zoomRegex);
      }
      else {
        var row, column, selectedValue;
        var cellSelection = d3.selectAll('.cell').filter(function(value, i) {
          var mousePosition = d3.mouse(this);
          row = Math.floor(mousePosition[1] / cellHeight);
          column = Math.floor(mousePosition[0] / cellWidth);
          selectedValue = value;
          return i == row * heatmapData.geneNames.length + column;
        }).node();
        _.extend(this.clickedObject_, {
          container: cellSelection,
          geneName: heatmapData.geneNames[row],
          conditionName: heatmapData.conditionNames[column],
          row: row,
          column: column,
          value: selectedValue
        });
        this.signal('expressionClick', this.clickedObject_);
      }
    }.bind(this));
};

/**
 * Renders the expression matrix gene (row) labels.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawMatrixGeneLabels_ = function() {
  if (!this.data.options.showGeneLabels) {
    this.svgGeneLabels_.selectAll('*').attr('display', 'none');
    return;
  } else {
    this.svgGeneLabels_.selectAll('*').attr('display', 'inline');
  }
  var heatmapData = this.data.matrix;
  var geneLabelsData = heatmapData.geneNames;

  var labels = this.svgGeneLabels_.selectAll('text').data(geneLabelsData);
  labels.enter().append('text')
    .classed('gene-label', true);
  labels.exit().remove();
  labels
    .text(_.identity)
    .attr('x', 0)
    .attr('y', function(geneName, i) {
      return i * this.cellHeight;
    }.bind(this));
};

/**
 * Renders the expression matrix condition (column) labels.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawMatrixConditionLabels_ = function() {
  if (!this.data.options.showConditionLabels) {
    this.svgConditionLabels_.selectAll('*').attr('display', 'none');
    return;
  } else {
    this.svgConditionLabels_.selectAll('*').attr('display', 'inline');
  }
  var heatmapData = this.data.matrix;
  var conditionLabelsData = heatmapData.conditionNames;

  var labels = this.svgConditionLabels_.selectAll('text')
    .data(conditionLabelsData);
  labels.enter().append('text')
    .classed('condition-label', true);
  labels.exit().remove();
  labels
    .attr('transform', genotet.utils.getTransform([0, 0], 1, -90))
    .text(_.identity)
    .attr('x', 0)
    .attr('y', function(conditionName, i) {
      return i * this.cellWidth;
    }.bind(this));
};

/**
 * Renders the expression heatmap gradient.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawHeatmapGradient_ = function() {
  var heatmapData = this.data.matrix;
  var scaleMin = 0;
  var scaleMax = 0;
  if (this.data.options.autoScaleGradient) {
    scaleMin = heatmapData.valueMin;
    scaleMax = heatmapData.valueMax;
  } else {
    scaleMin = heatmapData.allValueMin;
    scaleMax = heatmapData.allValueMax;
  }
  scaleMin = scaleMin.toFixed(2);
  scaleMax = scaleMax.toFixed(2);
  var marginLeft = scaleMin.toString().length *
    this.CONDITION_LABEL_HEIGHT_FACTOR;
  var marginRight = scaleMax.toString().length *
    this.CONDITION_LABEL_HEIGHT_FACTOR;

  var gradientHeight = this.DEFAULT_HEATMAP_GRADIENT_HEIGHT -
    this.HEATMAP_GRADIENT_MARGINS_.TOP -
    this.HEATMAP_GRADIENT_MARGINS_.BOTTOM;
  var gradientWidth = this.heatmapWidth_ - marginLeft - marginRight;
  this.gradientRect_
    .attr('transform', genotet.utils.getTransform([
      marginLeft,
      this.HEATMAP_GRADIENT_MARGINS_.TOP
    ]))
    .attr('width', gradientWidth)
    .attr('height', gradientHeight)
    .attr('rx', 10)
    .attr('ry', 10);
  d3.select('.gradient-text-left')
    .attr('x', marginLeft - this.HEATMAP_GRADIENT_MARGIN)
    .attr('y', this.HEATMAP_GRADIENT_MARGINS_.TOP + gradientHeight / 2 +
      this.TEXT_HEIGHT / 2)
    .text(scaleMin)
    .style('text-anchor', 'end');
  d3.select('.gradient-text-right')
    .attr('x', marginLeft + gradientWidth + this.HEATMAP_GRADIENT_MARGIN)
    .attr('y', this.HEATMAP_GRADIENT_MARGINS_.TOP + gradientHeight / 2 +
      this.TEXT_HEIGHT / 2)
    .text(scaleMax);
};

/**
 * Renders the expression profiles for the selected genes as line charts.
 * @private
 */
genotet.ExpressionRenderer.prototype.drawGeneProfiles_ = function() {
  if (!this.data.options.showProfiles) {
    this.svgProfile_.selectAll('*').attr('display', 'none');
    return;
  } else {
    this.svgProfile_.selectAll('*').attr('display', 'inline');
  }

  var heatmapData = this.data.matrix;
  this.svgProfile_.attr('width', this.canvasWidth);

  var legendHeight = this.DEFAULT_PROFILE_LEGEND_HEIGHT -
    this.DEFAULT_PROFILE_LEGEND_MARGIN;

  var xScale = d3.scale.linear().range([
    this.profileMargins_.left,
    this.canvasWidth - this.profileMargins_.right
  ]).domain([0, heatmapData.conditionNames.length]);
  var yScaleTop = this.profileMargins_.top +
    this.DEFAULT_PROFILE_LEGEND_HEIGHT;
  if (this.data.profiles.length == 0) {
    yScaleTop -= this.DEFAULT_PROFILE_LEGEND_HEIGHT;
  }
  var yScale = d3.scale.linear().range([
    this.profileHeight_ - this.profileMargins_.bottom,
    yScaleTop
  ]).domain([heatmapData.valueMin, heatmapData.valueMax]);
  var xAxis = d3.svg.axis()
    .scale(xScale).orient('bottom');
  var yAxis = d3.svg.axis()
    .scale(yScale).orient('left');
  this.svgProfileXAxis_.call(xAxis);
  this.svgProfileYAxis_.call(yAxis);

  var line = d3.svg.line()
    .x(function(data, i) {
      return xScale(i);
    })
    .y(yScale)
    .interpolate('linear');

  var legendRect = this.svgLegend_.selectAll('rect')
    .data(this.data.profiles);
  legendRect.enter().append('rect');
  legendRect
    .attr('height', legendHeight)
    .attr('width', legendHeight)
    .attr('x', function(profile, i) {
      return i * (legendHeight +
        profile.geneName.length * this.GENE_LABEL_WIDTH_FACTOR);
    }.bind(this))
    .style('fill', function(profile) {
      return this.COLOR_CATEGORY[genotet.utils.hashString(profile.geneName) %
        this.COLOR_CATEGORY_SIZE];
    }.bind(this));
  legendRect.exit().remove();

  var legendText = this.svgLegend_.selectAll('text')
    .data(this.data.profiles);
  legendText.enter().append('text');
  legendText
    .text(function(profile) {
      return profile.geneName;
    })
    .attr('transform', genotet.utils.getTransform([
      legendHeight + this.HEATMAP_LEGEND_MARGIN,
      legendHeight / 2 + this.TEXT_HEIGHT / 2
    ]))
    .attr('x', function(profile, i) {
      return i * (legendHeight +
        profile.geneName.length * this.GENE_LABEL_WIDTH_FACTOR);
    }.bind(this));
  legendText.exit().remove();

  var profilePath = this.profileContent_.selectAll('path')
    .data(this.data.profiles);
  profilePath.enter().append('path');
  profilePath
    .classed('profile', true)
    .attr('d', function(profile) {
      return line(heatmapData.values[profile.row]);
    })
    .attr('transform', genotet.utils.getTransform([
      this.heatmapWidth_ / (heatmapData.conditionNames.length * 2),
      0
    ]))
    .style('stroke', function(profile, i) {
      var pathColor = this.COLOR_CATEGORY[genotet.utils.hashString(
        profile.geneName) % this.COLOR_CATEGORY_SIZE];
      this.data.profiles[i].color = pathColor;
      return pathColor;
    }.bind(this))
    .on('mousemove', function(profile, i) {
      var conditionIndex = Math.floor(
        xScale.invert(d3.mouse(d3.event.target)[0]) + 0.5
      );
      var value = heatmapData.values[profile.row][conditionIndex];
      _.extend(this.data.profiles[i], {
        container: d3.event.target,
        hoverColumn: conditionIndex,
        hoverConditionName: heatmapData.conditionNames[conditionIndex],
        hoverValue: value
      });
      this.signal('pathHover', this.data.profiles[i]);
    }.bind(this))
    .on('mouseout', function(profile, i) {
      this.data.profiles[i].container = d3.event.target;
      this.signal('pathUnhover', this.data.profiles[i]);
    }.bind(this))
    .on('click', function(profile, i) {
      var conditionIndex = Math.floor(
        xScale.invert(d3.mouse(d3.event.target)[0]) + 0.5);
      var geneIndex = heatmapData.geneNames.indexOf(
        this.data.profiles[i].geneName);
      var value = heatmapData.values[geneIndex][conditionIndex];
      _.extend(this.clickedObject_, {
        container: d3.event.target,
        geneName: heatmapData.geneNames[geneIndex],
        conditionName: heatmapData.conditionNames[conditionIndex],
        row: geneIndex,
        column: conditionIndex,
        value: value
      });
      this.signal('expressionClick', this.clickedObject_);
    }.bind(this));
  profilePath.exit().remove();
};

/**
 * Adds the expression profiles for the selected genes as line charts.
 * @param {number} geneIndex
 */
genotet.ExpressionRenderer.prototype.addGeneProfile = function(geneIndex) {
  var profile = new genotet.ExpressionRenderer.Profile({
    geneName: this.data.matrix.geneNames[geneIndex],
    row: geneIndex
  });
  this.data.profiles.push(profile);
  this.drawGeneProfiles_();
};

/**
 * Adds the expression profiles for the selected genes as line charts.
 * @param {number} geneIndex
 */
genotet.ExpressionRenderer.prototype.removeGeneProfile = function(geneIndex) {
  var index = -1;
  for (var i = 0; i < this.data.profiles.length; i++) {
    if (this.data.profiles[i].row == geneIndex) {
      index = i;
      break;
    }
  }
  this.data.profiles.splice(index, 1);
  this.drawGeneProfiles_();
};

/**
 * Highlights the hover cell for the heatmap.
 * @param {!genotet.ExpressionRenderer.Cell} cell
 */
genotet.ExpressionRenderer.prototype.highlightHoverCell = function(cell) {
  if (cell.container) {
    var cellSelection = d3.select(cell.container);
    cellSelection.style('stroke', 'white');
  }
  this.svgGeneLabels_.selectAll('text').classed('highlighted', function(d, i) {
    return cell.row == i;
  });
  this.svgConditionLabels_.selectAll('text').classed('highlighted',
    function(d, i) {
      return cell.column == i;
    });
};

/**
 * Unhighlights the hover cell for the heatmap.
 * @param {!genotet.ExpressionRenderer.Cell} cell
 */
genotet.ExpressionRenderer.prototype.unhighlightHoverCell = function(cell) {
  if (cell.container) {
    var cellSelection = d3.select(cell.container);
    cellSelection.style('stroke', /** @type {string} */(cell.colorscaleValue));
  }
  this.svgGeneLabels_.selectAll('text').classed('highlighted', false);
  this.svgConditionLabels_.selectAll('text').classed('highlighted', false);
};

/**
 * Highlights the hover profile for the gene profile.
 * @param {!genotet.ExpressionRenderer.Profile} profile
 */
genotet.ExpressionRenderer.prototype.highlightHoverPath = function(profile) {
  if (profile.container) {
    var pathSelection = d3.select(profile.container);
    pathSelection.classed('highlighted', true);
  }
  this.svgGeneLabels_.selectAll('text').classed('highlighted', function(d, i) {
    return profile.row == i;
  });
  this.svgConditionLabels_.selectAll('text').classed('highlighted',
    function(d, i) {
      return profile.hoverColumn == i;
    });
};

/**
 * Unhover profile for the gene profile.
 * @param {!genotet.ExpressionRenderer.Profile} profile
 */
genotet.ExpressionRenderer.prototype.unhighlightHoverPath = function(profile) {
  if (profile.container) {
    var pathSelection = d3.select(profile.container);
    pathSelection.classed('highlighted', false);
  }
  this.svgGeneLabels_.selectAll('text').classed('highlighted', false);
  this.svgConditionLabels_.selectAll('text').classed('highlighted', false);
};

/**
 * Unhighlights the label of the clicked cells for the heatmap.
 * @param {!genotet.ExpressionRenderer.Cell} object
 */
genotet.ExpressionRenderer.prototype.highlightLabelsForClickedObject =
  function(object) {
    this.svgGeneLabels_
      .selectAll('text')
      .classed('click-highlighted', function(d, i) {
        return object.row == i;
      });
    this.svgConditionLabels_
      .selectAll('text')
      .classed('click-highlighted', function(d, i) {
        return object.column == i;
      });
  };

/**
 * Unhighlights all the labels of cells for the heatmap.
 */
genotet.ExpressionRenderer.prototype.unhighlightLabelsForClickedObject =
  function() {
    this.svgGeneLabels_
      .selectAll('text')
      .classed('click-highlighted', false);
    this.svgConditionLabels_
      .selectAll('text')
      .classed('click-highlighted', false);
  };

/**
 * Highlights the label of the clicked cell or profile.
 * @private
 */
genotet.ExpressionRenderer.prototype.highlightLabelsAfterUpdateData_ =
  function() {
    var heatmapData = this.data.matrix;
    if (this.clickedObject_.row != -1 && this.clickedObject_.column != -1) {
      this.clickedObject_.row = heatmapData.geneNames.indexOf(
        this.clickedObject_.geneName
      );
      this.clickedObject_.column = heatmapData.conditionNames.indexOf(
        this.clickedObject_.conditionName
      );
    }
    if (this.clickedObject_.row != -1 && this.clickedObject_.column != -1) {
        this.signal('expressionClick', this.clickedObject_);
    } else {
      this.signal('expressionUnclick');
    }
  };

/**
 * Load expression matrix data after zoom in and out the heatmap.
 * @param {!Object} params Parameters for expression zoom in.
 * @return {!Object} zoomRegex Parameters for data load.
 * @private
 */
genotet.ExpressionRenderer.prototype.zoomDataLoaded_ = function(params) {
  var heatmapData = this.data.matrix;
  var zoomRegex = {
    matrixName: heatmapData.matrixname,
    geneRegex: '',
    conditionRegex: '',
    geneNames: heatmapData.geneNames,
    conditionNames: heatmapData.conditionNames
  };
  for (var i = params.rowStart; i < params.rowEnd; i++) {
    zoomRegex.geneRegex += heatmapData.geneNames[i] + '|';
  }
  zoomRegex.geneRegex += heatmapData.geneNames[params.rowEnd];
  for (var i = params.columnStart; i < params.columnEnd; i++) {
    zoomRegex.conditionRegex += heatmapData.conditionNames[i] + '|';
  }
  zoomRegex.conditionRegex += heatmapData.conditionNames[params.columnEnd];
  return zoomRegex;
};

/**
 * Computes the horizontal and vertical label sizes for the heatmap.
 * The results are stored into:
 *     this.geneLabelWidth,
 *     this.conditionLabelHeight
 * @private
 */
genotet.ExpressionRenderer.prototype.getHeatmapLabelSizes_ = function() {
  var heatmapData = this.data.matrix;
  var geneLabelsData = heatmapData.geneNames;
  var conditionLabelsData = heatmapData.conditionNames;
  this.geneLabelWidth_ = 0;
  this.conditionLabelHeight_ = 0;

  if (this.data.options.showGeneLabels) {
    this.geneLabelWidth_ = d3.max(geneLabelsData.map(function(s) {
      return s.length;
    }));
    this.geneLabelWidth_ *= this.GENE_LABEL_WIDTH_FACTOR;
  }
  if (this.data.options.showConditionLabels) {
    this.conditionLabelHeight_ = d3.max(conditionLabelsData.map(function(s) {
      return s.length;
    }));
    this.conditionLabelHeight_ *= this.CONDITION_LABEL_HEIGHT_FACTOR;
  }
};

/** @inheritDoc */
genotet.ExpressionRenderer.prototype.resize = function() {
  genotet.ExpressionRenderer.base.resize.call(this);
  this.render();
};
