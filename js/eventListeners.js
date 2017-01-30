'use strict'
var L = require('leaflet')
var $ = require('jquery')
var Config = require('./config.js')

var my = {
  map: null,
  panel: null,
  poiFeat: null,
  tsFeat: null,
  actFeat: null,
  pgFeat: null,
  trailInfo: null
}

var allPadding = new L.point(100, 100)

var setup = function (map, panel, filters, poiFeature, trailSegmentFeature, activityFeature, picnicgroveFeature, trailInfo) {
  my.map = map
  my.panel = panel
  my.filters = filters
  my.poiFeat = poiFeature
  my.tsFeat = trailSegmentFeature
  my.actFeat = activityFeature
  my.pgFeat = picnicgroveFeature
  my.trailInfo = trailInfo
}

var events = function (map) {
  var that = {}
  var panel = my.panel

  window.onload = function () {
    // that.setHeights()
    $('.closeDetail').click(closeDetailPanel)
    $('#fpccMobileCheckbox').click(my.panel.showfpccMainContainer)
  }
  // .click(readdSearchURL) // Close the detail panel!

  var closeDetailPanel = function () {
    console.log('events.closeDetailPanel')
    my.panel.toggleDetailPanel('close')
    setTimeout(function () {
      map.closePopup()
      that.highlightPoi(null)
      that.highlightSegmentsForSubsystem(null)
    }, 0)
  }

  that.makeResults = function () {
    panel.makeTrailDivs(my.poiFeat, my.filters)
    $('.fpccEntry').click(that.trailDivClickHandler)
  }

  that.trailDivClickHandler = function (e) {
    console.log('trailDivClickHandler start')
    // document.getElementById('fpccContainer').innerHTML = loaderDiv
    panel.toggleDetailPanel('open')
    var $myTarget = $(e.currentTarget)
    var divTrailID = $myTarget.attr('data-trailid')
    var divTrailName = $myTarget.attr('data-trailname')
    console.log(divTrailID)
    var trailSubsystem = null
    var divPoiId = $myTarget.attr('data-trailheadid')
    console.log('trailDivClickHandler divPoiId = ' + divPoiId)
    if (divTrailName) {
      trailSubsystem = divTrailName
      that.trailDivWork(trailSubsystem, null)
    } else {
      console.log('trailDivClickHandler else divPoiId = ' + divPoiId)
      that.trailDivWork(null, divPoiId)
    }
  }

  that.trailDivWork = function (trailSubsystemName, poiId) {
    if (trailSubsystemName) {
      panel.showDetails(my, trailSubsystemName, null)
    } else {
      var divPoi = my.poiFeat.getPoiById(poiId)
      console.log('trailDivWork divPoi = ' + divPoi)
      console.log('[trailDivWork] about to showTrailDetails(divTrail, divTrailhead)')
      panel.showDetails(my, null, divPoi)
      if (divPoi.properties.direct_trail_id) {
        trailSubsystemName = my.trailInfo.originalTrailInfo[divPoi.properties.direct_trail_id].trail_subsystem.replace(/[& ]/g, '+')
      }
    }
    setTimeout(function () {
      console.log('trailDivWork setTimeout')
      var trailsGroupBounds = that.highlightSegmentsForSubsystem(trailSubsystemName)
      var trailheadGroupBounds = that.highlightPoi(divPoi)
      var zoomFeatureGroupBounds = null

      if (divPoi) {
        zoomFeatureGroupBounds = trailheadGroupBounds
      } else {
        zoomFeatureGroupBounds = trailsGroupBounds
      }
      console.log('[trailDivWork] before fitbounds')
      map.fitBounds(zoomFeatureGroupBounds, {
        padding: allPadding
        // paddingTopLeft: centerOffset
      })
    }, 0)
    console.log('trailDivWork end')
  }

  that.testFunction = function (trailSubsystem) {
    console.log('[eventListeners testFunction] trailSubsystem = ' + trailSubsystem)
    console.log('[eventListeners testFunction] my.poiFeat = ' + my.poiFeat)
  }

  that.poiClick = function (poi) {
    console.log('[events poiClick] start')
    var zoomFeatureGroupBounds = that.highlightPoi(poi)
    // var poi = my.poiFeat.getPoiById(poiId)
    var trailSubsystem = poi.properties.trail_subsystem || null
    that.highlightSegmentsForSubsystem(trailSubsystem)
    // my.map.panTo(zoomFeatureGroupBounds.getCenter()) // Temporary fix for fitBounds not properly refreshing canvas.
    if (my.map.getBoundsZoom(zoomFeatureGroupBounds) >= my.map.getZoom()) {
      my.map.fitBounds(zoomFeatureGroupBounds,
        {
          // paddingTopLeft: centerOffset
          padding: allPadding
        })
    } else {
      my.map.fitBounds(zoomFeatureGroupBounds, {
        maxZoom: my.map.getZoom(),
        padding: allPadding
        // paddingTopLeft: centerOffset
      })
    }
    my.panel.showDetails(my, null, poi)
    console.log('[events poiClick] end')
  }

  that.activityClick = function (activity) {
    var lastPoi = ''
    var lastPoiId = ''
    if (my.poiFeat.current) {
      lastPoi = my.poiFeat.current
      lastPoiId = lastPoi.properties.id
    }
    var poi = my.poiFeat.getPoiById(activity.properties.poi_info_id)
    if (poi) {
      my.panel.showDetails(my, null, poi)
      if (lastPoiId != activity.properties.poi_info_id) {
        var zoomFeatureGroupBounds = that.highlightPoi(poi, false)
        var trailSubsystem = null
        if (poi.properties.direct_trail_id) {
          trailSubsystem = my.trailInfo.originalTrailInfo[poi.properties.direct_trail_id].trail_subsystem
          trailSubsystem = trailSubsystem.replace(/[& ]/g, '+')
        }
        that.highlightSegmentsForSubsystem(trailSubsystem)
        // map.panTo(zoomFeatureGroupBounds.getCenter()); // Temporary fix for fitBounds not properly refreshing canvas.
        my.map.fitBounds(zoomFeatureGroupBounds, {
          maxZoom: my.map.getZoom(),
          padding: allPadding
           // paddingTopLeft: centerOffset
        })
      }
    }
  }

  that.highlightPoi = function (poi, openPopup) {
    console.log('[events highlightPoi] start')
    if (openPopup === undefined) {
      openPopup = true
    }
    // var poi = null
    // if (poiId) {
    //   poi = my.poiFeat.getPoiById(poiId)
    // }
    var zoomArray = []
    $('.leaflet-marker-icon.selected').removeClass('selected')
    if (poi) {
      my.poiFeat.current = poi
      zoomArray.push(my.poiFeat.current)
      var myEntranceID = 'poi-' + my.poiFeat.current.properties.id
      console.log('[poiFeature highlight] new my.poiFeat.current = ' + myEntranceID)
      $('.leaflet-marker-icon.' + myEntranceID).addClass('selected')
      if (openPopup) {
        my.map.closePopup()
        console.log('[poiFeature highlight] create + open popup')
        var popup = new L.Popup({
          offset: [0, -12],
          autoPanPadding: [10, 10]
          // autoPan: SMALL ? false : true
        })
        .setContent(my.poiFeat.current.popupContent)
        .setLatLng(my.poiFeat.current.getLatLng())
        .openOn(my.map)
      }
      var activityArray = my.actFeat.originalActivitiesObject[my.poiFeat.current.properties.id]
      $.each(activityArray, function (i, el) {
        el.setIcon(el.selectedIcon)
      })
      if (my.actFeat.originalActivitiesObject[my.poiFeat.current.properties.id]) {
        zoomArray = zoomArray.concat(my.actFeat.originalActivitiesObject[my.poiFeat.current.properties.id])
      }
      if (my.pgFeat.originalObject[my.poiFeat.current.properties.id]) {
        zoomArray = zoomArray.concat(my.pgFeat.originalObject[my.poiFeat.current.properties.id])
      }
    } else {
      my.map.closePopup()
      my.poiFeat.current = null
    }
    var zoomFeatureGroup = new L.FeatureGroup(zoomArray)
    var zoomBounds = zoomFeatureGroup.getBounds()
    return zoomBounds
  }

  that.segmentClick = function (trailSubsystemNormalizedName) {
    console.log('[events segmentClick] start')
    my.panel.showDetails(my, trailSubsystemNormalizedName, null)
    that.highlightSegmentsForSubsystem(trailSubsystemNormalizedName)
    that.highlightPoi(null)
  }

  that.highlightSegmentsForSubsystem = function (trailSubsystem) {
    console.log('[events highlightSegmentsForSubsystem] start trailSubsystem = ' + trailSubsystem)
    var zoomBounds = null
    if (my.tsFeat.currentHighlightedSubsystem) {
      console.log('[events highlightSegmentsForSubsystem] there is a current currentHighlightedSubsystem')
      var oldSegments = my.tsFeat.segmentTrailSubsystemObject[my.tsFeat.currentHighlightedSubsystem]
      $.each(oldSegments, function (i, el) {
        el.setStyle({weight: 4})
      })
      my.tsFeat.currentHighlightedSubsystem = null
    }
    if (trailSubsystem) {
      trailSubsystem = trailSubsystem.replace(/[& ]/g, '+')
      var segments = my.tsFeat.segmentTrailSubsystemObject[trailSubsystem]
      $.each(segments, function (i, el) {
        el.setStyle({weight: 7})
      })
      if (segments) {
        var currentHighlightedSegmentLayer = new L.FeatureGroup(segments)
        zoomBounds = currentHighlightedSegmentLayer.getBounds()
      }
      my.tsFeat.currentHighlightedSubsystem = trailSubsystem
    }
    console.log('[events highlightSegmentsForSubsystem] end')
    return zoomBounds
  }

  return that
}

module.exports = {
  setup: setup,
  events: events
}
