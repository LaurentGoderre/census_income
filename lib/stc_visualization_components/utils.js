(function() {
window.i18n = (function() {
  var lang = document.documentElement.lang,
    blankFormatter = {
      format: function(d){return d;}
    };

  return {
    lang: lang,
    load: function(url_roots, callback) {
      i18next.init({
        lng: lang
      }).on("initialized", function() {
        var q = d3.queue(),
          i;

        for(i = 0; i < url_roots.length; i++) {
          q = q.defer(d3.json, url_roots[i] + "/" + lang + ".json");
        }

        q.await(function() {
          var j, data, namespaces, n, ns;
          for (j = 1; j < arguments.length; j++) {
            data = arguments[j];
            namespaces = Object.keys(data[lang]);
            for (n = 0; n < namespaces.length; n++) {
              ns = namespaces[n];
              i18next.addResourceBundle(lang, ns, data[lang][ns]);
            }
          }

          if (callback) {
            callback();
          }
        });
      });
    },
    getNumberFormatter: function(options) {
      var min;

      if (typeof options !== "object") {
        min = arguments[0] || 0;
        options = {
          minimumFractionDigits: min,
          maximumFractionDigits: arguments.length > 1 ? arguments[1] : min
        };
      }

      try {
        return new Intl.NumberFormat(lang, options);
      } catch (e) {
        return blankFormatter;
      }
    },
    getDateFormatter: function(options) {
      try {
        return new Intl.DateTimeFormat(lang, options);
      } catch (e) {
        return blankFormatter;
      }
    }
  };
})();

d3 = d3 || {};

d3.stcExt = {
  get5PointsInterpolation: function(negativeStartColor, negativeEndColor, neutralColor, positiveStartColor, positiveEndColor) {
    var rgbNegStart = d3.rgb(negativeStartColor),
      rgbNegEnd = d3.rgb(negativeEndColor),
      rgbPosStart = d3.rgb(positiveStartColor),
      rgbPosEnd = d3.rgb(positiveEndColor),
      startColor, endColor;

    return function(t) {
      if (t === 0) {
        return neutralColor;
      } else if (t > 0) {
        startColor = rgbPosStart;
        endColor = rgbPosEnd;
      } else {
        startColor = rgbNegStart;
        endColor = rgbNegEnd;
      }

      return d3.rgb.apply(null, ["r", "g", "b"].map(function(channel) {
        var diff = endColor[channel] - startColor[channel];
        return startColor[channel] + diff * Math.abs(t);
      }));
    };
  },
  get3PointsInterpolation: function(negativeColor, neutralColor, positiveColor, deadzone) {
    var rgbNeutral = d3.rgb(neutralColor),
      rgbNegEnd = d3.rgb(negativeColor),
      rgbPosEnd = d3.rgb(positiveColor),
      addDeadzone = function(color) {
        return d3.rgb.apply(null, ["r", "g", "b"].map(function(channel) {
          var currentChannel = neutralColor[channel],
            diff = color[channel] - currentChannel,
            newDeadzone;

          if ((diff < 0  && diff > -deadzone) || diff > 0 && diff < deadzone) {
            newDeadzone = 0;
          } else {
            newDeadzone =  diff < 0 ? deadzone : -deadzone;
          }

          return rgbNeutral[channel] - newDeadzone;
        }));
      },
      rgbNegStart, rgbPosStart;

    deadzone = deadzone || 0;

    rgbNegStart =  addDeadzone(rgbNegEnd);
    rgbPosStart =  addDeadzone(rgbPosEnd);
    return d3.stcExt.get5PointsInterpolation(rgbNegStart, rgbNegEnd, neutralColor, rgbPosStart, rgbPosEnd);
  },
  // Source: https://stackoverflow.com/questions/6338217/get-a-css-value-with-javascript
  getStyleRuleValue: function (style, selector) {
    var value = null,
      i, j, mysheet, myrules;
    for ( i = 0; i < document.styleSheets.length; i++) {
      mysheet = document.styleSheets[i];
      try {
        myrules = mysheet.cssRules ? mysheet.cssRules : mysheet.rules;
        for (j = 0; j < myrules.length; j++) {
          if (myrules[j].selectorText &&
              myrules[j].selectorText.toLowerCase() === selector) {
            value =  myrules[j].style[style];
          }
        }
      } catch(e) {
        continue;
      }
    }
    return value;
  },

  getSymbol: function(def) {
    if (!def.id) {
      def.id = (+new Date).toString();
    }
    var appendSymbolTo = function(el) {
        var symbol = el.append("symbol")
          .attr("id", def.id);

        if (def.viewBox) {
          symbol.attr("viewBox", Array.isArray(def.viewBox) ? def.viewBox.join(" ") : def.viewBox);
        }

        symbol.append("path")
          .attr("d", def.d);
        return symbol;
      },
      appendReferenceTo = function(el) {
        return el.append("use")
          .attr("href", "#" + def.id);
      };
    return {
      appendSymbolTo: appendSymbolTo.bind(def),
      appendReferenceTo: appendReferenceTo.bind(def)
    };
  },
  addIEShim: function(svg, height, width) {
    if (svg.node().msContentZoomFactor && svg.classed("svg-shimmed") === false) {
      svg.each(function() {
        var el = this,
          fn = function() {
            return el;
          },
          shim = d3.select(el.parentNode)
            .insert("div", fn)
              .attr("class", "svg-shim-container")
              .style("position", "relative");

        shim.append(fn);
        shim.append("canvas")
          .attr("class", "svg-shim")
          .attr("height", height)
          .attr("width", width)
          .style("width", "100%");
      });

      svg
        .classed("svg-shimmed", true)
        .style("height", "100%")
        .style("left", "0")
        .style("position", "absolute")
        .style("top", "0")
        .style("width", "100%");
    }
  }
};

if (!Math.bankerRound) {
  Math.bankerRound = function(num, decimalPlaces) {
    var d = decimalPlaces || 0;
    var m = Math.pow(10, d);
    var n = +(d ? num * m : num).toFixed(8); // Avoid rounding errors
    var i = Math.floor(n), f = n - i;
    var e = 1e-8; // Allow for rounding errors in f
    var r = (f > 0.5 - e && f < 0.5 + e) ?
                ((i % 2 == 0) ? i : i + 1) : Math.round(n);
    return d ? r / m : r;
  };
}

})();
