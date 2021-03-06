'use strict'
var L = require('leaflet')
var $ = require('jquery')
var pluralize = require('pluralize')
var Config = require('./config.js')
var eL = require('./eventListeners.js')
var autolink = require('autolink-js')
var map
var filters
var panel
var poiFeat
var tsFeat
var actFeat
var pgFeat
var trailInfo
var events
var alertFeat

var setup = function (myMap, myFilters, myPoiFeature, myTrailSegmentFeature, myActivityFeature, myPicnicgroveFeature, myTrailInfo, myAlertFeature) {
  map = myMap
  filters = myFilters
  poiFeat = myPoiFeature
  tsFeat = myTrailSegmentFeature
  actFeat = myActivityFeature
  pgFeat = myPicnicgroveFeature
  trailInfo = myTrailInfo
  alertFeat = myAlertFeature
}

var panelFuncs = function (map) {
  var that = {}
  that.SMALL = false
  that.padding = new L.Point(400, 10)
  that.paddingRight = new L.Point(10, 10)
  var events = eL.events(map)

  that.currentDetailPanelHTML = ''

  var aboutHTML = '<div id="fpccPreserveName" class="detailPanelBanner"><span id="fpccTrailName" class="trailName">About</span><svg id="closeAbout" class="icon icon-x closeDetail"><use id="useCloseAbout" xlink:href="icons/defs.svg#icon-x"></use></svg></div><div id="fpccPreserveInfo" class="detailPanelBody"><div id="fpccAbout" class="fpccUnit fpccContainer">' +
                  '<p>Welcome to the <a href="https://fpdcc.com/">Forest Preserves  of Cook County</a>. This web map is designed to help current and future  visitors:</p>' +
                  '<ul><li>Plan trips </li>' +
                  '<li>Navigate preserves, trails and other  amenities</li>' +
                  '<li>Discover new opportunities within the preserves</li></ul>' +
                  '<p>Please consider <a class="menuFeedback" href="https://fpdcc.wufoo.com/forms/znt02n10csdbi3/def/" target="_blank">leaving  us feedback</a> so we can continue to improve this map. Learn more about the  Forest Preserves of Cook County at <a href="https://fpdcc.com/">fpdcc.com</a>.</p>' +
                  '<h2>Development</h2>' +
                  '<p>This project is a partnership between the Forest Preserves of Cook County and Smart Chicago Collaborative. The resulting web application is built on two pieces of source  code: <a href="https://github.com/codeforamerica/trailsy">Trailsy</a> and <a href="https://github.com/codeforamerica/trailsyserver">Trailsy Server</a>, both  pioneered by <a href="https://www.codeforamerica.org/">Code for America</a>.  All of the data used to power the site is open for all.</p>' +
                  '<p>Smart Chicago consultant Josh Kalov is the main developer of this project.</p>' +
                  '<p><a href="https://github.com/fpdcc/trailsy/">View the project’s GitHub page</a> or <a href="https://github.com/fpdcc/webmap_data_updates">download Forest Preserves web map data</a>.</p>' +
                  '<h2>Funding</h2>' +
                  '<p>Made possible with funding from the Centers for Disease Control and Prevention through the Healthy Hotspot initiative led by the Cook  County Department of Public Health. Learn more at <a href="http://healthyhotspot.org/">healthyhotspot.org</a>. Smart Chicago  provided in-kind services for this project.</p>' +
                  '</div></div>'

  var checkOutsideMenu = function (e) {
    var $info = $('.fpccMenuList');
    if (!$info.is(e.target) && $info.has(e.target).length === 0) {
      //$info.hide();
      that.changeMenuDisplay()
    }
  }

  // Open/close fpccMenu list
  that.changeMenuDisplay = function () {
    console.log("changeMenuDisplay")
    if ($('.fpccMenuList').hasClass('hide')) {
      that.buildFeedbackLink()
      $('.fpccMenuList').removeClass('hide').addClass('show')
      $(document).on('mousedown touchstart', checkOutsideMenu)
    } else {
      $('.fpccMenuList').removeClass('show').addClass('hide')
      $(document).off('mousedown touchstart', checkOutsideMenu)
    }
  }

  var checkOutsideMobileMenu = function (e) {
    var $info = $('.fpccMobileMenuList');
    if (!$info.is(e.target) && $info.has(e.target).length === 0) {
      that.changeMobileMenuDisplay()
    }
  }

  // Open/close fpccMenu list
  that.changeMobileMenuDisplay = function () {
    console.log('changeMobileMenuDisplay')
    if ($('.fpccMobileMenuList').hasClass('hide')) {
      that.buildFeedbackLink()
      $('.fpccMobileMenuList').removeClass('hide').addClass('show')
      $(document).on('mousedown touchstart', checkOutsideMobileMenu)
    } else {
      $(document).off('mousedown touchstart', checkOutsideMobileMenu)
      $('.fpccMobileMenuList').removeClass('show').addClass('hide')
    }
  }

  that.openAboutPage = function () {
    console.log('openAboutPage')
    that.populateDetailPanel(aboutHTML)
    that.buildFeedbackLink()
    that.toggleDetailPanel('open')
    that.setHeights()
  }

  that.closeAboutPage = function () {
    console.log('closeAboutPage')
    if (that.currentDetailPanelHTML) {
      that.populateDetailPanel(that.currentDetailPanelHTML)
    } else {
      that.toggleDetailPanel('close')
    }
  }

  that.buildFeedbackLink = function () {
    console.log('goToFeedback')
    var feedbackURL = 'https://fpdcc.wufoo.com/forms/znt02n10csdbi3/def/' +
    'Field8=' + $.address.baseURL() + '&Field2=' + $.address.queryString()
    $('.menuFeedback').attr('href', feedbackURL)
  }

  window.onload = function () {
    that.setHeights()
  }

  var testCloseDetail = function () {
    console.log('closure clicked!')
  }
  window.onresize = function () {
    that.setHeights()
  }

  that.setSmall = function () {
    if (window.innerWidth <= 900) {
      that.SMALL = true
    } else {
      that.SMALL = false
    }
    return that.SMALL
  }

  that.setHeights = function () {
    console.log('setHeights start')
    that.setSmall()
    var h = window.innerHeight
    var k = document.getElementById('fpccBrand').offsetHeight
    var l = document.getElementById('fpccBrandMobile').offsetHeight
    var m = 0
    var fpccPreserveInfo = document.getElementById('fpccPreserveInfo')
    var fpccPreserveName = document.getElementById('fpccPreserveName')
    if (fpccPreserveName) {
      m = fpccPreserveName.offsetHeight
    }
    var o = document.getElementById('fpccSearchBack').offsetHeight
    var p = document.getElementById('fpccSearchStatus').offsetHeight
    var q = document.getElementById('fpccSearchContainer').offsetHeight
    console.log('[setHeights] h = ' + h)
    console.log('[setHeights] k + l + m + o + p + q = ' + k + ' + ' + l + ' + ' + m + ' + ' + o + ' + ' + p + ' + ' + q)
    var fpccSearchResultsHeight = (h - (k + l + o + p + q))
    fpccSearchResultsHeight = fpccSearchResultsHeight.toString() + 'px'
    console.log('[setHeights] fpccSearchResultsHeight= ' + fpccSearchResultsHeight)
    document.getElementById('fpccSearchResults').style.maxHeight = fpccSearchResultsHeight
    var fpccPreserveInfoHeight = 0
    if (that.SMALL) {
      // console.log('[setHeights] yes small')
      that.padding = new L.Point(10, 10)
      fpccPreserveInfoHeight = (h - (l + m + o)).toString() + 'px'
      if (fpccPreserveInfo) {
        fpccPreserveInfo.style.minHeight = fpccPreserveInfoHeight
      }
      document.getElementById('fpccSearchResults').style.minHeight = fpccSearchResultsHeight
    } else {
      var trailListColumnWidth = $('#fpccTrailListColumn').outerWidth()
      that.padding = new L.Point(400, 10)
      console.log('trailListColumnWidth = ' + trailListColumnWidth)
      if (trailListColumnWidth) {
        that.padding = new L.Point(trailListColumnWidth + 10, 10)
      }
      console.log('that.padding = ' + that.padding)
      fpccPreserveInfoHeight = (h - (k + m + o + q)).toString() + 'px'
      // console.log('[setHeights] no small')
    }
    if (fpccPreserveInfo) {
      fpccPreserveInfo.style.maxHeight = fpccPreserveInfoHeight
    }
    console.log('[setHeights] #fpccPreserveInfoHeight= ' + fpccPreserveInfoHeight)
    console.log('[setHeights] that.padding= ' + that.padding)
  }

  that.makeTrailDivs = function (poiFeat, tInfo, filters, open) {
    console.log('makeTrailDivs start')
    var trailList = {} // used to see if trail div has been built yet.
    var divCount = 0
    var topLevelID = 'desktop'
    if (open) {
      map.closePopup()
      that.toggleResultsList('open')
    }
    var trailListContents = ''
    $.each(poiFeat.filteredPoisArray, function (i, el) {
      var poiTrailSubsystem = el.properties.trail_subsystem
      if (poiTrailSubsystem) {
        var trailSubsystemName = poiTrailSubsystem
        var trailSubsystemNormalizedName = poiTrailSubsystem.replace(/[& ]/g, '+')
        var trailName = poiTrailSubsystem
        var trailLength = null //Number(Math.round(originalTrailData[trailID].properties.length +'e2')+'e-2')
      } else {
        var trailSubsystemName = null
        var trailSubsystemNormalizedName = null
        var trailID = null
        var trail = null
        var trailName = null
        var trailLength = null
      }

      var poiName = el.properties.name
      var poiId = el.properties.id

      var trailDivText = "<a class='fpccEntry clearfix' " +
        "data-source='list' " +
        "data-trailid='" + "' " +
        "data-trailname='" + "' " +
        "data-trail-length='" + "' " +
        "data-trailheadName='" + poiName + "' " +
        "data-trailheadid='" + poiId + "' " +
        "data-analyticstype='List' " +
        "data-analyticsdescription='" + poiName + "' " +
        "data-index='" + 0 + "'>"

      var trailheadInfoText = "<span class='fpccEntryName'>" +
        '<svg class="icon icon-sign"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-sign"></use></svg>' +
        '<span class="fpccEntryNameText">' + poiName + '</span></span>'
      if (el.properties.distance) {
        if (filters.current.userLocation || filters.current.searchLocation) {
          var poiDistance = metersToMiles(el.properties.distance)
          trailheadInfoText += '<span class="fpccEntryDis">' + poiDistance + ' miles away</span></a>'
        }
      }
      trailheadInfoText += '</div>'
      var trailDivComplete = trailDivText + trailheadInfoText
      trailListContents = trailListContents + trailDivComplete
      divCount++
      if ((!trailList[trailSubsystemNormalizedName]) && tInfo.filteredSystemNames[trailSubsystemNormalizedName] && trailSubsystemNormalizedName && filters.current.trailInList) {
        trailDivText = "<a class='fpccEntry clearfix' " +
          "data-source='list' " +
          "data-trailid='" + trailSubsystemNormalizedName + "' " +
          "data-trailname='" + trailSubsystemNormalizedName + "' " +
          "data-trail-length='" + trailLength + "' " +
          "data-trailheadName='" + null + "' " +
          "data-trailheadid='" + null + "' " +
          "data-analyticstype='List' " +
          "data-analyticsdescription='" + trailSubsystemName + "' " +
          "data-index='" + 0 + "'>"
        trailheadInfoText = "<span class='fpccEntryName'>" +
          '<svg class="icon icon-trail-marker"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>' +
          '<span class="fpccEntryNameText">' + trailSubsystemName + ' </span></span>' +
          '</div>'
        trailList[trailSubsystemNormalizedName] = 1
        trailDivComplete = trailDivText + trailheadInfoText
        trailListContents = trailListContents + trailDivComplete
        divCount++
      }
    })
    $.each(tInfo.filteredSystemNames, function (systemNormName, el) {
      if ((!trailList[systemNormName]) && filters.current.trailInList) {
        var trailSubsystemName = tInfo.trailSubsystemMap[systemNormName][0].trail_subsystem
        //console.log('makeTrailDivs systemNormName = ' + systemNormName)
        //console.log('makeTrailDivs tInfo.trailSubsystemMap[systemNormName] = ' + tInfo.trailSubsystemMap[systemNormName])
        //console.log('makeTrailDivs trailSubsystemName = ' + trailSubsystemName)
        var trailDivText = "<a class='fpccEntry clearfix' " +
          "data-source='list' " +
          "data-trailid='" + systemNormName + "' " +
          "data-trailname='" + systemNormName + "' " +
          //"data-trail-length='" + trailLength + "' " +
          "data-trailheadName='" + null + "' " +
          "data-trailheadid='" + null + "' " +
          "data-analyticstype='List' " +
          "data-analyticsdescription='" + trailSubsystemName + "' " +
          "data-index='" + 0 + "'>"
        var trailheadInfoText = "<span class='fpccEntryName'>" +
          '<svg class="icon icon-trail-marker"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>' +
          '<span class="fpccEntryNameText">' + trailSubsystemName + ' </span></span>' +
          '</div>'
        trailList[systemNormName] = 1
        var trailDivComplete = trailDivText + trailheadInfoText
        trailListContents = trailListContents + trailDivComplete
        divCount++
      }
    })
    $('#fpccSearchResults').html(trailListContents)
    $('#fpccSearchStatus').html(divCount + ' Results Found')
    if (open) {
      that.setHeights()
    }
    console.log('[makeTrailDivs] end at:' + performance.now())
  }

  that.showDetails = function (myReferences, trailSubsystemNormalizedName, poi) {
    console.log('[panelFunctions showDetails start')
    var trailSubsystemTrails = null
    var descriptionTrail = null
    var trailSubsystemName = null
    var trailSubsystemId = null
    if (trailSubsystemNormalizedName) {
      trailSubsystemTrails = myReferences.trailInfo.trailSubsystemMap[trailSubsystemNormalizedName] || null
      descriptionTrail = trailSubsystemTrails[0] || null
      console.log("[showDetails] descriptionTrail = " + descriptionTrail)
      if (descriptionTrail) {
        trailSubsystemName = descriptionTrail.trail_subsystem
        trailSubsystemId = descriptionTrail.trail_subsystem_id
        console.log("[showDetails] trailSubsystemId = " + trailSubsystemId)
      }
    }
    that.toggleDetailPanel('open')
    var poiLink = null
    var trailLink = null
    if (trailSubsystemName) {
      changePageTitle(trailSubsystemName)
      trailLink = encodeURIComponent(trailSubsystemNormalizedName)
      // if (trailSubsystemId) {
      //   trailLink = encodeURIComponent(trailSubsystemId + '-' + trailSubsystemNormalizedName)
      // }
      trailLink = trailLink.replace(/%2B/g, '+')
    } else if (poi) {
      changePageTitle(poi.properties.name)
      poiLink = poi.link
    }
    $.address.parameter('trail', trailLink)
    $.address.parameter('poi', poiLink)
    $.address.parameter('search', null)
    $.address.update()

    if ($('#fpccMobileCheckbox').is(':checked')) {
      that.slideDetailPanel(false)
    } else {
      console.log('showTrailDetails checked is false')
      that.slideDetailPanel(true)
    }
    that.buildDetailPanelHTML(myReferences, trailSubsystemNormalizedName, poi)
    that.populateDetailPanel(that.currentDetailPanelHTML)
    that.setHeights()
    console.log('[panelFunctions showDetails end')
  }

  that.buildAlertHTML = function (alerts, sectionId) {
    var alertCount = alerts.length
    console.log("alertCount = " + alerts.length)
    var alertsHTML = '<div class="fpccAlerts"><div class="fpccAlertHead clearfix fpccUnit" data-sectionid="' + sectionId + '"><span class="fpccAlertIcon"><svg class="icon icon-alert"><use xlink:href="icons/defs.svg#icon-alert"></use></svg></span><span class="fpccAlertNumber">' + alertCount + ' ' + pluralize('alert', alertCount) + '</span><span class="fpccAlertToggle" id="alertToggle-' + sectionId + '">+</span></div><div class="fpccAlertBlurb fpccUnit" id="alertBlurb-' + sectionId + '">'
    $.each(alerts, function (i, alert) {
      var alertHTML = '<span class="fpccSingleAlert"><strong>' +
                      alert.start_date + ' - '
      if (alert.end_date) {
        alertHTML += alert.end_date
      } else {
        alertHTML += "?"
      }   
      alertHTML += ':</strong> ' + alert.description.autoLink()
      if (alert.link) {
        alertHTML += ' <a href="' + alert.link + '">More information ></a>'
      }
      alertHTML += '</span>'
      alertsHTML += alertHTML
    })
    alertsHTML += '</div></div>'
    return alertsHTML
  }

  that.toggleAlerts = function (e) {
    //console.log('toggleAlerts')
    var $myTarget = $(e.currentTarget)
    var sectionId = $myTarget.attr('data-sectionid')
    $('#alertBlurb-' + sectionId).toggle('slow', function () {
      // console.log('toggle complete!')
      if ($(this).is(':visible')) {
        $('#alertToggle-' + sectionId).text('-')
      } else {
        $('#alertToggle-' + sectionId).text('+')
      }
    })
  }

  that.buildDetailPanelHTML = function (myReferences, trailSubsystemNormalizedName, poi) {
    var directTrail = null
    var descriptionTrail = null
    var trailSubsystemTrails = null
    var displayName = ''
    var fpccNameHTML = '<div id="fpccPreserveName" class="detailPanelBanner"><span id="fpccTrailName" class="trailName">'
    var fpccContainerHTML = '<div id="fpccPreserveInfo" class="detailPanelBody"><div id="fpccContainer" class="fpccContainer">'
    // console.log('[decorateDetailPanelForTrailhead2]')
    if (trailSubsystemNormalizedName) {
      trailSubsystemTrails = myReferences.trailInfo.trailSubsystemMap[trailSubsystemNormalizedName] || null
      descriptionTrail = trailSubsystemTrails[0] || null
      displayName = descriptionTrail.trail_subsystem
      fpccNameHTML += displayName
      // document.getElementById('fpccTrailName').innerHTML = displayName
      // $('#fpccPreserveName .trailName').html(trailSubsystemName)
    }

    if (poi) {
      if (poi.properties.name) {
        displayName = poi.properties.name
        fpccNameHTML += displayName
        // document.getElementById('fpccTrailName').innerHTML = poi.properties.name
        // $('#fpccPreserveName .trailName').html(poi.properties.name)
      }
      directTrail = myReferences.trailInfo.originalTrailInfo[poi.properties.direct_trail_id] || null
      if (directTrail) {
        trailSubsystemNormalizedName = directTrail.trail_subsystem.replace(/[& ]/g, '+')
        trailSubsystemTrails = myReferences.trailInfo.trailSubsystemMap[trailSubsystemNormalizedName] || null
        descriptionTrail = directTrail
      }
      fpccContainerHTML += '<div class="fpccTop">'
      // ADD ALERTS INFO HERE
      if (myReferences.alertFeat) {
        console.log('globalAlerts.length = ' + myReferences.alertFeat.globalAlerts.length)
        console.log('poiAlerts.length = ' + myReferences.alertFeat.poiAlerts.length)
        var poiAlerts = myReferences.alertFeat.poiAlerts[poi.properties.id] || []
        poiAlerts = myReferences.alertFeat.globalAlerts.concat(poiAlerts)
        console.log('poiAlerts = ' + poiAlerts)
        if (poiAlerts.length > 0) {
          fpccContainerHTML += that.buildAlertHTML(poiAlerts, "poi")
        }
      }
      fpccContainerHTML += '<div class="fpccEntrance fpccUnit clearfix">' +
                         '<div class="fpccSign clearfix">' +
                         '<svg class="icon icon-sign"><use xlink:href="icons/defs.svg#icon-sign"></use></svg>' +
                         '<div class="fpccAddress">' +
                         '<span class="fpccLabel fpccBlock">'
      if (poi.properties.web_street_addr) {
        fpccContainerHTML += 'Entrance</span><span class="fpccEntranceAddress">' +
                           poi.properties.web_street_addr + '</span>'
      } else {
        fpccContainerHTML += 'Location</span>'
      }
      if (poi.properties.web_muni_addr) {
        fpccContainerHTML += '<span class="fpccEntranceZip">' + poi.properties.web_muni_addr + '</span>'
      }
      if (poi.closeParkingLink && !poi.properties.web_street_addr) {
        fpccContainerHTML += '<span class="fpccCloseParking"><a class="" href="#/?poi=' + poi.closeParkingLink + '">View closest parking area</a></span>'
      }
      if (poi.properties.phone) {
        fpccContainerHTML += '<span class="fpccPhone">' + poi.properties.phone + '</span>'
      }
      var directionsUrl = 'http://maps.google.com?saddr='
      if (myReferences.filters.current.userLocation) {
        directionsUrl += myReferences.filters.current.userLocation.lat + ',' + myReferences.filters.current.userLocation.lng
      }
      directionsUrl += '&daddr=' + poi.geometry.coordinates[1] + ',' + poi.geometry.coordinates[0]
      fpccContainerHTML += '</div></div><div class="fpccButtonContainer">' 
      fpccContainerHTML += '<a href="' + directionsUrl + '" target="_blank" id="entranceDirections" class="fpccButton fpccDirections" data-analyticstype="Directions" data-analyticsdescription="' + displayName + '">Directions</a>'
      
      if (poi.properties.web_link) {
         fpccContainerHTML += '<a href="' + poi.properties.web_link + '" id="entranceWebsite" class="fpccButton secondary" data-analyticstype="LocationWebpageButton" data-analyticsdescription="' + poi.properties.name +'">Location Webpage</a>'
      }
      fpccContainerHTML += '</div></div>' // Closing fpccButtonContainer div and fpccEntrance
     


      if (poi.properties.description) {
        fpccContainerHTML += '<div class="fpccDescription fpccUnit">' + poi.properties.description + '</div>'
      }

      var fpccAmenitiesString = ''
      var naturePreserveString = ''
      var accessibleDescriptionString = ''
      if ((poi.properties.tags) && (poi.properties.tags[':panel'])) {
        console.log('tags.panel = ' + poi.properties.tags[':panel'])
        // want Parking and Trail Access at top
        // parking = Parking
        if (poi.properties.tags[':panel'].indexOf('parking') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-parking'><use xlink:href='icons/defs.svg#icon-parking'></use></svg><span class='fpccAmenityTitle'>Parking Lot</span></div>"
        }

        // no_parking = No Parking
        if (poi.properties.tags[':panel'].indexOf('no_parking') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-no-parking'><use xlink:href='icons/defs.svg#icon-no-parking'></use></svg> <span class='fpccAmenityTitle'>No Parking Lot</span></div>"
        }

        // Building Bathrooms
        console.log('panel tags: ' + poi.properties.tags[':panel'])
        if ((poi.properties.tags[':panel'].indexOf('bathroom_building_winter') > -1) || (poi.properties.tags[':panel'].indexOf('bathroom_building_summer') > -1)) {
          if ((poi.properties.tags[':panel'].indexOf('bathroom_building_ada') > -1)) {
            fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-bathroom-building-ada'><use xlink:href='icons/defs.svg#icon-bathroom-building-ada'></use></svg> <span class='fpccAmenityTitle'>"
            if (!(poi.properties.tags[':panel'].indexOf('bathroom_building_winter') > -1)) {
              fpccAmenitiesString += '*'
            }
            fpccAmenitiesString += 'Accessible Indoor Bathroom'
          } else {
            fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-bathroom-building'><use xlink:href='icons/defs.svg#icon-bathroom-building'></use></svg> <span class='fpccAmenityTitle'>"
            if (!(poi.properties.tags[':panel'].indexOf('bathroom_building_winter') > -1)) {
              fpccAmenitiesString += '*'
            }
            fpccAmenitiesString += 'Indoor Bathroom'
          }
          fpccAmenitiesString += '</span></div>'
        }
        // Portable Bathrooms
        if ((poi.properties.tags[':panel'].indexOf('bathroom_portable_winter') > -1) || (poi.properties.tags[':panel'].indexOf('bathroom_portable_summer') > -1)) {
          
          if ((poi.properties.tags[':panel'].indexOf('bathroom_portable_ada') > -1)) {
            fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-bathroom-portable-ada'><use xlink:href='icons/defs.svg#icon-bathroom-portable-ada'></use></svg> <span class='fpccAmenityTitle'>"
            if ((!(poi.properties.tags[':panel'].indexOf('bathroom_portable_winter') > -1)) || (!(poi.properties.tags[':panel'].indexOf('bathroom_portable_summer') > -1))) {
              fpccAmenitiesString += '**'
            }
            fpccAmenitiesString += 'Accessible Portable Bathroom'
          } else {
            fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-bathroom-portable'><use xlink:href='icons/defs.svg#icon-bathroom-portable'></use></svg> <span class='fpccAmenityTitle'>"
            if ((!(poi.properties.tags[':panel'].indexOf('bathroom_portable_winter') > -1)) || (!(poi.properties.tags[':panel'].indexOf('bathroom_portable_summer') > -1))) {
              fpccAmenitiesString += '**'
            }
            fpccAmenitiesString += 'Portable Bathroom'
          }
          fpccAmenitiesString += '</span></div>'
        }

        // trailacces = Trail System Access
        if (poi.properties.tags[':panel'].indexOf('trailhead') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-trail-marker'><use xlink:href='icons/defs.svg#icon-trail-marker'></use></svg><span class='fpccAmenityTitle'>Trail Access</span></div>"
        }
    
        // Activities/Amenities on map
        
        // bike_rental = Bike Rental
        if (poi.properties.tags[':panel'].indexOf('bike_rental') > -1 ) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-bike-rental'><use xlink:href='icons/defs.svg#icon-bike-rental'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/bicycling/'>Bike Rental</a></span></div>"
        }

        // accessible_boat = Accessible Boat
        // If there is boat_ramp AND accessible_boat, only accessible_boat shows in the panel
        if (poi.properties.tags[':panel'].indexOf('accessible_boat') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-boat-launch-accessible'><use xlink:href='icons/defs.svg#icon-boat-launch-accessible'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/boating-canoeing-kayaking/'>Accessible Boat Launch</a></span></div>"
        } else if (poi.properties.tags[':panel'].indexOf('boat_ramp') > -1) {
          // boat_ramp = Boat Launch
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-boat-launch'><use xlink:href='icons/defs.svg#icon-boat-launch'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/boating-canoeing-kayaking/'>Boat Launch</a></span></div>"
        }

        // boat_rental = Boat Rental
        if (poi.properties.tags[':panel'].indexOf('boat_rental') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-boat-rental'><use xlink:href='icons/defs.svg#icon-boat-rental'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/boating-canoeing-kayaking/'>Boat Rental</a></span></div>"
        }
        // camping = Campground
        if (poi.properties.tags[':panel'].indexOf('camping') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-camp'><use xlink:href='icons/defs.svg#icon-camp'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/camping/'>Campground</a></span></div>"
        }

        // shower = Shower
        if (poi.properties.tags[':panel'].indexOf('shower') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-camp-shower'><use xlink:href='icons/defs.svg#icon-camp-shower'></use></svg><span class='fpccAmenityTitle'>Shower</span></div>"
        }

        // dining_hall = Dining Hall
        if (poi.properties.tags[':panel'].indexOf('dining_hall') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-camp-dine'><use xlink:href='icons/defs.svg#icon-camp-dine'></use></svg><span class='fpccAmenityTitle'>Dining Hall</span></div>"
        }

        // sanitation_station = Sanitation Station
        if (poi.properties.tags[':panel'].indexOf('sanitation_station') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-camp-sanitary'><use xlink:href='icons/defs.svg#icon-camp-sanitary'></use></svg><span class='fpccAmenityTitle'>Sanitation Station</span></div>"
        }

        // camp_store = Camp Store
        if (poi.properties.tags[':panel'].indexOf('camp_store') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-camp-store'><use xlink:href='icons/defs.svg#icon-camp-store'></use></svg><span class='fpccAmenityTitle'>Camp Store</span></div>"
        }
        // accessible_campsite = Accessible Campsites
        if (poi.properties.tags[':panel'].indexOf('accessible_campsite') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-camp-accessible'><use xlink:href='icons/defs.svg#icon-camp-accessible'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/camping/'>Accessible Campsites</a></span></div>"
        }

        // accessible_canoe = Accessible Canoe
        // If there is canoe AND accessible_canoe, only accessible_canoe shows in the panel
        if (poi.properties.tags[':panel'].indexOf('accessible_canoe') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-canoe-landing-accessible'><use xlink:href='icons/defs.svg#icon-canoe-landing-accessible'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/boating-canoeing-kayaking/'>Accessible Canoe Landing</a></span></div>"
        } else if (poi.properties.tags[':panel'].indexOf('canoe') > -1) {
          // canoe = Canoe Landing
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-canoe-landing'><use xlink:href='icons/defs.svg#icon-canoe-landing'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/boating-canoeing-kayaking/'>Canoe Landing</a></span></div>"
        }
        
        // disc_golf = Disc Golf
        if (poi.properties.tags[':panel'].indexOf('disc_golf') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-disc-golf'><use xlink:href='icons/defs.svg#icon-disc-golf'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/disc-golf/'>Disc Golf</a></span></div>"
        }

        //  dog_friendly = Off-Leash Dog Area
        if (poi.properties.tags[':panel'].indexOf('dog_friendly') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-off-leash-dog-area'><use xlink:href='icons/defs.svg#icon-off-leash-dog-area'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/dogs/'>Off-Leash Dog Area</a></span></div>"
        }

        // golf = Golf
        if (poi.properties.tags[':panel'].indexOf('golf') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-golf-course-driving-range'><use xlink:href='icons/defs.svg#icon-golf-course-driving-range'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/golf/'>Golf</a></span></div>"
        }
        //  driving_range = Driving Range
        if (poi.properties.tags[':panel'].indexOf('driving_range') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-golf-course-driving-range'><use xlink:href='icons/defs.svg#icon-golf-course-driving-range'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/golf/'>Driving Range</a></span></div>"
        }

        // m_airplane = Model Airplane Flying Field
        if (poi.properties.tags[':panel'].indexOf('m_airplane') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-model-airplane'><use xlink:href='icons/defs.svg#icon-model-airplane'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/model-airplane-drones/'>Model Airplane Flying Field</a></span></div>"
        }

        // m_boat = Model Sailboat
        if (poi.properties.tags[':panel'].indexOf('m_boat') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-model-sailboat'><use xlink:href='icons/defs.svg#icon-model-sailboat'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/boating-canoeing-kayaking/'>Model Sailboat</a></span></div>"
        }

        // nature_center = Nature Center
        if (poi.properties.tags[':panel'].indexOf('nature_center') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-nature-center'><use xlink:href='icons/defs.svg#icon-nature-center'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/nature-centers/'>Nature Center</a></span></div>"
        }

        // natureplay = Nature Play
        if (poi.properties.tags[':panel'].indexOf('natureplay') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-nature-play'><use xlink:href='icons/defs.svg#icon-nature-play'></use></svg><span class='fpccAmenityTitle'>Nature Play</span></div>"
        }
        
        // picnic_grove = Picnic Grove
        if (poi.properties.tags[':panel'].indexOf('picnic_grove') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity picnic-grove'><svg class='icon icon-picnic-grove'><use xlink:href='icons/defs.svg#icon-picnic-grove'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/permits/picnics-event-permits/'>Picnic Grove</a></span></div>"
        }

        // shelter = Picnic Grove (with shelter)
        if (poi.properties.tags[':panel'].indexOf('shelter') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-picnic-grove-shelter'><use xlink:href='icons/defs.svg#icon-picnic-grove-shelter'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/permits/picnics-event-permits/'>Picnic Grove <br>(with shelter)</a></span></div>"
        }
        // accessible_shelter = Accessible Picnic Shelter
        if (poi.properties.tags[':panel'].indexOf('accessible_shelter') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-accessible-picnic-grove'><use xlink:href='icons/defs.svg#icon-accessible-picnic-grove'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/permits/picnics-event-permits/'>Accessible Picnic Shelter</a></span></div>"
        }
        // public_building = Public Building
        if (poi.properties.tags[':panel'].indexOf('public_building') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity public-building'><svg class='icon icon-facility'><use xlink:href='icons/defs.svg#icon-facility'></use></svg><span class='fpccAmenityTitle'>Public Building</span></div>"
        }
        // sledding = Sledding
        if (poi.properties.tags[':panel'].indexOf('sledding') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-sledding'><use xlink:href='icons/defs.svg#icon-sledding'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/sledding/'>Sledding</a></span></div>"
        }

        // snowmobile = Snowmobile Area
        if (poi.properties.tags[':panel'].indexOf('snowmobile') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-snowmobiling'><use xlink:href='icons/defs.svg#icon-snowmobiling'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/snowmobiling/'>Snowmobile Area</a></span></div>"
        }

        // swimming = Aquatic Center
        if (poi.properties.tags[':panel'].indexOf('swimming') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-aquatic-center'><use xlink:href='icons/defs.svg#icon-aquatic-center'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/swimming/'>Aquatic Center</a></span></div>"
        }

        // Activities/Amenities NOT on map

        // birding = Birding Hotspot
        if (poi.properties.tags[':panel'].indexOf('birding') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-birding-hotspot'><use xlink:href='icons/defs.svg#icon-birding-hotspot'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/birding/'>Birding Hotspot</a></span></div>"
        }
        // cycling = Bicycling
        if (poi.properties.tags[':panel'].indexOf('cycling') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-bicycling'><use xlink:href='icons/defs.svg#icon-bicycling'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/bicycling/'>Bicycling</a></span></div>"
        }

        // cross_country = Cross-Country Skiing
        if (poi.properties.tags[':panel'].indexOf('cross_country') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-cross-country-skiing'><use xlink:href='icons/defs.svg#icon-cross-country-skiing'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/cross-country-skiing/'>Cross-Country Skiing</a></span></div>"
        }

        //  dog_leash = Dogs (with a leash)
        if (poi.properties.tags[':panel'].indexOf('dog_leash') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-dog-leash'><use xlink:href='icons/defs.svg#icon-dog-leash'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/dogs/'>Dogs <br>(on-leash only)</a></span></div>"
        }

        // no_dogs = No Dogs
        if (poi.properties.tags[':panel'].indexOf('no_dogs') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-no-dogs'><use xlink:href='icons/defs.svg#icon-no-dogs'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/dogs/'>No Dogs</a></span></div>"
        }

        // fitness_stairs = Fitness Stairs
        if (poi.properties.tags[':panel'].indexOf('fitness_stairs') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-stairs'><use xlink:href='icons/defs.svg#icon-stairs'></use></svg><span class='fpccAmenityTitle'>Fitness Stairs</span></div>"
        }

        // zip_line = Zip Line
        if (poi.properties.tags[':panel'].indexOf('zip_line') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-zip-line'><use xlink:href='icons/defs.svg#icon-zip-line'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/zip-line/'>Zipline & Adventure Park</a></span></div>"
        }

        //  drone = Drone Flying
        if (poi.properties.tags[':panel'].indexOf('drone') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-drone'><use xlink:href='icons/defs.svg#icon-drone'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/model-airplane-drones/'>Drone Flying Area</a></span></div>"
        }

        // equestrian = Equestrian
        if (poi.properties.tags[':panel'].indexOf('equestrian') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-equestrian'><use xlink:href='icons/defs.svg#icon-equestrian'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/equestrian/'>Equestrian Parking</a></span></div>"
        }

        // fishing = Fishing
        if (poi.properties.tags[':panel'].indexOf('fishing') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-fishing'><use xlink:href='icons/defs.svg#icon-fishing'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/fishing/'>Fishing</a></span></div>"
        }

        // hiking = Hiking
        if (poi.properties.tags[':panel'].indexOf('hiking') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-hiking'><use xlink:href='icons/defs.svg#icon-hiking'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/hiking-walking-running/'>Hiking, Walking & Running</a></span></div>"
        }

        // ice_fishing = Ice Fishing
        if (poi.properties.tags[':panel'].indexOf('ice_fishing') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-ice-fishing'><use xlink:href='icons/defs.svg#icon-ice-fishing'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/fishing/'>Ice Fishing</a></span></div>"
        }

        // accessible_fishing = Accessible Fishing Area
        if (poi.properties.tags[':panel'].indexOf('accessible_fishing') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-fishing-accessible'><use xlink:href='icons/defs.svg#icon-fishing-accessible'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/fishing/'>Accessible Fishing Area</a></span></div>"
        }


        // no_alcohol = No Alcohol
        if (poi.properties.tags[':panel'].indexOf('no_alcohol') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-no-alcohol'><use xlink:href='icons/defs.svg#icon-no-alcohol'></use></svg><span class='fpccAmenityTitle'>No Alcohol <br>(without permit)</span></div>"
        }
        // no_fishing = No Fishing
        if (poi.properties.tags[':panel'].indexOf('no_fishing') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-no-fishing'><use xlink:href='icons/defs.svg#icon-no-fishing'></use></svg> <span class='fpccAmenityTitle'>No Fishing</span></div>"
        }
        // overlook = Scenic Overlook
        if (poi.properties.tags[':panel'].indexOf('overlook') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-scenic-overlook'><use xlink:href='icons/defs.svg#icon-scenic-overlook'></use></svg><span class='fpccAmenityTitle'>Scenic Overlook</span></div>"
        }
        // skating_ice = Ice Skating
        if (poi.properties.tags[':panel'].indexOf('skating_ice') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-ice-skating'><use xlink:href='icons/defs.svg#icon-ice-skating'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/things-to-do/ice-skating/'>Ice Skating</a></span></div>"
        }

        // volunteer = Volunteer Opportunities
        if (poi.properties.tags[':panel'].indexOf('volunteer') > -1) {
          fpccAmenitiesString += "<div class='fpccAmenity'><svg class='icon icon-volunteer'><use xlink:href='icons/defs.svg#icon-volunteer'></use></svg><span class='fpccAmenityTitle'><a href='https://fpdcc.com/volunteer/'>Volunteer Opportunities</a></span></div>"
        }

        // accessible and there is an accessible description
        if ( (poi.properties.tags[':panel'].indexOf('accessible') > -1) && (poi.properties.accessibility_description) ) {
          accessibleDescriptionString += "<div class='fpccAD clearfix'><a href='https://fpdcc.com/about/accessibility/'><svg class='icon icon-accessible-amenities'><use xlink:href='icons/defs.svg#icon-accessible-amenities'></use></svg></a><p>" + poi.properties.accessibility_description + "</p>"
          accessibleDescriptionString += "<p><strong>Learn more:</strong></p><ul>"
          accessibleDescriptionString += "<li><a href='" + poi.properties.web_link + "'>" + poi.properties.name + " Webpage</a></li><li><a href='https://fpdcc.com/about/accessibility/'>Accessibility Webpage</a></li></ul></div>"
        }

        // nature_preserve = Nature Preserve
        if (poi.properties.tags[':panel'].indexOf('nature_preserve') > -1) {
          naturePreserveString = '<div class="fpccNP clearfix"><a href="https://fpdcc.com/nature/illinois-nature-preserves/"><img src="images/idnr-np-logo.png" width="75" height="65" alt="Illinois Nature Preserves Commission Logo"></a><p> This land is designated as one of the highest quality natural areas in the state by the Illinois Nature Preserves Commission. This status includes increased levels of legal protection and management. Learn more on the <a href="https://fpdcc.com/nature/illinois-nature-preserves/">Illinois Nature Preserves Page</a></p></div>'
        }

      }
      var bathroomDisclaimerString = '<div class="asterisk">'
      var useBathroomDisclaimer = false
      if ((!(poi.properties.tags[':panel'].indexOf('bathroom_building_winter') > -1)) && (poi.properties.tags[':panel'].indexOf('bathroom_building_summer') > -1)) {
        bathroomDisclaimerString += '<div class="bathroom-season">*Indoor bathroom open April 1 to October 31 depending on weather conditions.</div>'
        useBathroomDisclaimer = true
      }
      if ((!(poi.properties.tags[':panel'].indexOf('bathroom_portable_winter') > -1)) && (poi.properties.tags[':panel'].indexOf('bathroom_portable_summer') > -1)) {
        bathroomDisclaimerString += '<div class="portable-bathroom-season">**Portable bathroom open May 1 to October 31 depending on weather conditions.</div>'
        useBathroomDisclaimer = true
      }
      if ((poi.properties.tags[':panel'].indexOf('bathroom_portable_winter') > -1) && (!(poi.properties.tags[':panel'].indexOf('bathroom_portable_summer') > -1))) {
        bathroomDisclaimerString += '<div class="portable-bathroom-season">**Portable bathroom open November 1 to April 30 depending on weather conditions.</div>'
        useBathroomDisclaimer = true
      }
      if (useBathroomDisclaimer) {
        bathroomDisclaimerString += '</div>'
        fpccAmenitiesString += bathroomDisclaimerString
      }

      if (fpccAmenitiesString.length > 0) {
        fpccContainerHTML += '<div class="fpccAmenities fpccUnit clearfix">' + fpccAmenitiesString + '</div>'
      }
      if (accessibleDescriptionString.length > 0) {
        fpccContainerHTML += accessibleDescriptionString
      }
      if (naturePreserveString.length > 0) {
        fpccContainerHTML += naturePreserveString
      }

      var hoursHTML = ''
      if (poi.properties.hours1) {
        hoursHTML += '<span class="fpccHours1"><span>' + poi.properties.season1
        hoursHTML += ':</span> ' + poi.properties.hours1 + '</span>'
      }
      if (poi.properties.hours2) {
        hoursHTML += '<span class="fpccHours2"><span>' + poi.properties.season2
        hoursHTML += ':</span> ' + poi.properties.hours2 + '</span>'
      }
      if (poi.properties.special_hours) {
        hoursHTML += '<span class="fpccSpecialHours">' + poi.properties.special_hours + '</span>'
      }
      if (hoursHTML != '') {
        fpccContainerHTML += '<div class="fpccHours fpccUnit"><span class="fpccLabel">Hours</span>'
                           + hoursHTML + '</div>'
      }

      var extraLinksText = '<span class="fpccLabel ">More Information</span><ul>'
      var extraLinksExist = true
      if (poi.properties.web_link) {
        extraLinksExist = true
        extraLinksText += '<li><a class="" href="' + poi.properties.web_link
        extraLinksText += '">Location Webpage</a></li>'
      }
      if (poi.properties.map_link) {
        extraLinksExist = true
        extraLinksText += '<li><a class="" href="' + poi.properties.map_link
        extraLinksText += '" target="_blank">English Map (PDF)</a></li>'
      }
      if (poi.properties.map_link_spanish) {
        extraLinksExist = true
        extraLinksText += '<li><a class="" href="' + poi.properties.map_link_spanish
        extraLinksText += '" target="_blank">Mapa Español (PDF)</a></li>'
      }
      if (poi.properties.picnic_link) {
        extraLinksExist = true
        extraLinksText += '<li><a class="" href="' + poi.properties.picnic_link
        extraLinksText += '" target="_blank">Picnic Grove Map (PDF)</a></li>'
      }
      if (poi.properties.fish_map) {
        extraLinksExist = true
        extraLinksText += '<li><a class="" href="' + poi.properties.fish_map
        extraLinksText += '" target="_blank">Fishing Lake Map (PDF)</a></li>'
      }
      if (poi.properties.vol_link) {
        extraLinksExist = true
        extraLinksText += '<li><a class="" href="' + poi.properties.vol_link
        extraLinksText += '" target="_blank">Volunteer Opportunity</a></li>'
      }
      if (poi.properties.vol_link2) {
        extraLinksExist = true
        extraLinksText += '<li><a class="" href="' + poi.properties.vol_link2
        extraLinksText += '" target="_blank">Volunteer Opportunity</a></li>'
      }
      extraLinksText += '<li><a href="https://fpdcc.com/about/rules-regulations/">Rules &amp; Frequently Asked Questions</a></li>'
      extraLinksText += '</ul></div>'
      if (extraLinksExist === true) {
        fpccContainerHTML += '<div class="fpccLinks fpccUnit clearfix">' + extraLinksText + '</div>'
      }
    }
    var closeID = 'closeDetail'
    fpccNameHTML += '</span><svg id="closeDetail" class="icon icon-x closeDetail"><use id="useCloseDetail" xlink:href="icons/defs.svg#icon-x"></use></svg></div>'
    // Trails Section
    var trailsHTML = ''
    trailSubsystemNormalizedName
    if (myReferences.alertFeat) {
      var trailAlerts = myReferences.alertFeat.trailSubsystemAlerts[trailSubsystemNormalizedName] || []
      trailAlerts = myReferences.alertFeat.globalAlerts.concat(trailAlerts)
      if (trailAlerts.length > 0) {
        trailsHTML += that.buildAlertHTML(trailAlerts, "trail")
      }
    }
    if (descriptionTrail) {
      // console.log('[decorateDetailPanelForTrailhead] system = ' + descriptionTrail.trail_subsystem)
      var subSystem = descriptionTrail.trail_subsystem
      trailsHTML += '<div class="fpccTrails fpccUnit clearfix">'
      if (directTrail) {
        trailsHTML += '<svg class="icon icon-trail-marker"><use xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>'
                    + '<div class="fpccTrailHeader">'
                    + '<span class="fpccLabel fpccBlock">Trail Access</span>'
                    + '<span class="fpccTrailName">'
                    + subSystem
                    + '</span></div>'
      }            
      var trailDescriptionHTML = '<div class="fpccTrailDescription">'
      var showDescription = false
      if (descriptionTrail.trail_desc) {
        showDescription = true
        trailDescriptionHTML += '<div class="fpccTrailDescription" id="trailDescription">'
                              + descriptionTrail.trail_desc
                              + '</div>'
      }
      var showMaps = false
      var trailMapHTML = '<div class="fpccTrailMaps clearfix trailMaps">'
      console.log('[decorateDetailPanelForTrailhead2] showMaps = ' + showMaps)
      if (descriptionTrail.web_link != null && descriptionTrail.web_link != '') {
        trailMapHTML += '<a class="fpccButton" id="trailWebsite" href="' + descriptionTrail.web_link + '">Trail Webpage</a>'
        showMaps = true
        showDescription = true
      }
      if (descriptionTrail.map_link != null && descriptionTrail.map_link != '') {
        // console.log('[decorateDetailPanelForTrailhead2] descriptionTrail.map_link is true? ' + descriptionTrail.map_link)
        trailMapHTML += '<a class="fpccButton secondary" id="pdfEnglish" href="'
                      + descriptionTrail.map_link + '" target="_blank">PDF Map</a>'
        showMaps = true
        showDescription = true
      }
      trailMapHTML += '</div>'
      console.log('[decorateDetailPanelForTrailhead] showMaps = ' + showMaps)
      if (showMaps) {
        trailDescriptionHTML += trailMapHTML
      }
      trailDescriptionHTML += '</div>'
      if (showDescription) {
        trailsHTML += trailDescriptionHTML
      }
      var hoursHTML = ''
      if (descriptionTrail.hours1) {
        hoursHTML += '<span class="fpccHours1"><strong>' + descriptionTrail.season1
        hoursHTML += ':</strong> ' + descriptionTrail.hours1 + '</span>'
      }
      if (descriptionTrail.hours2) {
        hoursHTML += '<span class="fpccHours2"><strong>' + descriptionTrail.season2
        hoursHTML += ':</strong> ' + descriptionTrail.hours2 + '</span>'
      }
      if (descriptionTrail.special_hours) {
        hoursHTML += '<span class="fpccSpecialHours">' + descriptionTrail.special_hours + '</span>'
      }
      if (hoursHTML != '') {
        trailsHTML += '<div class="fpccHours fpccUnit"><span class="fpccLabel">Hours</span>'
                           + hoursHTML + '</div>'
      }
      var trailSegmentsHTML = '<div class="fpccTrailSegments">'
      var indirectHTML = ""
      if (directTrail) {
        //console.log('[panelFunctions] directTrail? = ' + directTrail)
        var directTrailHTML = buildTrailSegmentHTML(directTrail)
        trailSegmentsHTML += directTrailHTML
        indirectHTML += '<div class="fpccAccessTo fpccLabel"><svg class="icon icon-trail-marker" style="display: inline-block"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="icons/defs.svg#icon-trail-marker"></use></svg>with access to:</div>'
      }
      //console.log('[panelFunctions] trailSubsystemTrails? = ' + trailSubsystemTrails)
      if (trailSubsystemTrails) {
        //console.log(trailSubsystemTrails)
        trailSubsystemTrails.sort((a, b) => parseFloat(b.subtrail_length_mi) - parseFloat(a.subtrail_length_mi))


        var useIndirect = false
        for (var trailIndex = 0; trailIndex < trailSubsystemTrails.length; trailIndex++) {
          var thisTrail = trailSubsystemTrails[trailIndex]
          if (directTrail) {
            //console.log('[panelFunctions] thisTrail.direct_trail_id = ' + thisTrail.subtrail_id)
            //console.log('[panelFunctions] directTrail.direct_trail_id = ' + directTrail.subtrail_id)
            if (thisTrail.subtrail_id != directTrail.subtrail_id) {
              if (thisTrail.subtrail_length_mi >= 1) {
                useIndirect = true
                indirectHTML += buildTrailSegmentHTML(thisTrail)
              } else if ( (subSystem.includes("Center Trails") || subSystem.includes("Trailside Museum")) && (thisTrail.subtrail_length_mi >= .1) ) {
                useIndirect = true
                indirectHTML += buildTrailSegmentHTML(thisTrail)
              }
            }
          } else {
            if (thisTrail.subtrail_length_mi >= 1 || trailIndex == 0) {
              useIndirect = true
              indirectHTML += buildTrailSegmentHTML(thisTrail)
            } else if ( (subSystem.includes("Center Trails") || subSystem.includes("Trailside Museum")) && (thisTrail.subtrail_length_mi >= .1) ) {
              useIndirect = true
              indirectHTML += buildTrailSegmentHTML(thisTrail)
            }
          } 
        }
        if (useIndirect) {
          trailSegmentsHTML += indirectHTML
        }
      }
      if ( !(subSystem.includes("Center Trails") || subSystem.includes("Trailside Museum")) )  {
        trailSegmentsHTML += '<span class="fpccOneMile">*Segments under 1 mile not shown.</span>'
                         + '</div>'
      }
      trailsHTML += trailSegmentsHTML
      var trailMoreInfoHTML = ''
      trailMoreInfoHTML += '<div class="fpccLinks fpccUnit clearfix"><span class="fpccLabel">More Information</span><ul>'
      if (descriptionTrail.web_link) {
        trailMoreInfoHTML += '<li><a href="' + descriptionTrail.web_link + '">Trail Webpage</a></li>'
      }
      if (descriptionTrail.map_link) {
        trailMoreInfoHTML += '<li><a href="' + descriptionTrail.map_link + '">English Map (PDF)</a></li>'
      }
      if (descriptionTrail.map_link_spanish) {
        trailMoreInfoHTML += '<li><a href="' + descriptionTrail.map_link_spanish + '">Mapa Español (PDF)</a></li>'
      }
      trailMoreInfoHTML += '<li><a href="https://fpdcc.com/about/rules-regulations/">Rules & Frequently Asked Questions</a></li>'
      trailMoreInfoHTML += '</ul></div>'
      trailsHTML += trailMoreInfoHTML
      trailsHTML +='</div>'
      fpccContainerHTML += trailsHTML
    }
    fpccContainerHTML += '</div>'
    var socialLink = encodeURIComponent(window.location.href)
    socialLink = socialLink.replace(/%20/g, '+')
    socialLink = socialLink.replace('/#/", "/')
    fpccContainerHTML += '<div class="fpccSocial fpccUnit clearfix">'
                       + '<div class="fpccShare">Share Your Plans:</div><a href="'
                       + 'mailto:?subject=Map: ' + displayName +' in the Forest Preserves of Cook County&body=' + socialLink
                       + '" id="fpccSocialEmail" class="fpccSocialIcon">'
                       + '<svg class="icon icon-email"><use xlink:href="icons/defs.svg#icon-email"></use></svg>'
                       + '<span>Email</span></a>'
                       + '<a href="https://twitter.com/intent/tweet?text=Map: ' + displayName + '&via=FPDCC&url=' + socialLink
                       + '" id="fpccSocialTwitter" class="fpccSocialIcon" target="_blank">'
                       + '<svg class="icon icon-twitter"><use xlink:href="icons/defs.svg#icon-twitter"></use></svg>'
                       + '<span>Twitter</span></a>'
                       + '<a href="' + 'https://www.facebook.com/dialog/share?app_id=1382262871801846&display=popup&href=' + socialLink + '&redirect_uri=' + socialLink
                       + '" id="fpccSocialFacebook" class="fpccSocialIcon" target="_blank">'
                       + '<svg class="icon icon-facebook"><use xlink:href="icons/defs.svg#icon-facebook"></use></svg>'
                       + '<span>Facebook</span></a></div>'  
    fpccContainerHTML += '</div></div>'
    // var fpccDisplayPanelElement = document.getElementById('fpccDetailPanel')

    that.currentDetailPanelHTML = fpccNameHTML + fpccContainerHTML
    
    // fpccDisplayPanelElement.innerHTML = fullHTML
  }

  var buildTrailSegmentHTML = function (trailSegment) {
    var thisColor = trailSegment.trail_color
    var thisType = trailSegment.trail_type
    var thisNameType = trailSegment.segment_type
    var thisDirection = trailSegment.direction
    console.log('[buildTrailSegmentHTML] trailSegment = ' + trailSegment)
    var trailSegmentHTML = '<div class="fpccTrailSegment"><div class="fpccSegmentOverview '
    //console.log('[buildTrailSegmentHTML] trailSegment.off_fpdcc= ' + trailSegment.off_fpdcc)
    //console.log('[buildTrailSegmentHTML] trailSegment.trail_color= ' + trailSegment.trail_color)
    if (trailSegment.off_fpdcc === 'y') {
      trailSegmentHTML += 'off '
      trailSegmentHTML += trailSegment.trail_color.replace(/ /g, '_').toLowerCase()
    } else {
      trailSegmentHTML += trailSegment.trail_color.replace(/ /g, '_').toLowerCase()
    }
    trailSegmentHTML += ' ' + thisType.replace(/ /g, '_').toLowerCase()
    // if (thisType.toLowerCase() != "paved") {
    //   trailSegmentHTML += " fpccUnpaved";
    // }
    trailSegmentHTML += ' clearfix"><span class="fpccSegmentName">'
    trailSegmentHTML += trailSegment.segmentName
    trailSegmentHTML += '</span><span class="fpccTrailUse">';
    //console.log('[buildTrailSegmentHTML] trailSegment.tags = ' + trailSegment.tags)
    if ((trailSegment.tags) && (trailSegment.tags.panel)) {
      console.log('[buildTrailSegmentHTML] tags.panel = ' + trailSegment.tags.panel)
      if (trailSegment.tags.panel.indexOf('hiking') > -1) {
        trailSegmentHTML += '<svg class="icon icon-hiking"><use xlink:href="icons/defs.svg#icon-hiking"></use></svg>';
      }
      if (trailSegment.tags.panel.indexOf('biking') > -1) {
        trailSegmentHTML += '<svg class="icon icon-bicycling"><use xlink:href="icons/defs.svg#icon-bicycling"></use></svg>';
      }
      if (trailSegment.tags.panel.indexOf('dog_leash') > -1) {
        trailSegmentHTML += '<svg class="icon icon-dog-leash"><use xlink:href="icons/defs.svg#icon-dog-leash"></use></svg>';
      }
      if (trailSegment.tags.panel.indexOf('cross_country') > -1) {
        trailSegmentHTML += '<svg class="icon icon-cross-country-skiing"><use xlink:href="icons/defs.svg#icon-cross-country-skiing"></use></svg>';
      }
      if (trailSegment.tags.panel.indexOf('equestrian') > -1) {
        trailSegmentHTML += '<svg class="icon icon-equestrian"><use xlink:href="icons/defs.svg#icon-equestrian"></use></svg>';
      }
      if (trailSegment.tags.panel.indexOf('no_dogs') > -1) {
        trailSegmentHTML += '<svg class="icon icon-no-dogs"><use xlink:href="icons/defs.svg#icon-no-dogs"></use></svg>';
      }
    }
    trailSegmentHTML += '</span>';
    trailSegmentHTML += '<svg width="100%" height="8px"><line x1="4" x2="100%" y1="4" y2="4" stroke-width="8"/></svg>';
    trailSegmentHTML += '</div><div class="fpccSegmentDetails clearfix">';
    if (trailSegment.subtrail_length_mi) {
      var length_mi = parseFloat(trailSegment.subtrail_length_mi).toFixed(1)
      //if (length_mi >= .1) {
        trailSegmentHTML += '<span class="fpccLabel fpccLeft"><span>Length: </span>';
        trailSegmentHTML += length_mi
        trailSegmentHTML += ' mi</span>';
      //}
    }
    
    trailSegmentHTML += '<span class="fpccLabel fpccRight"><span>Surface: </span>';
    trailSegmentHTML += thisType;
    trailSegmentHTML += '</span></div></div>';
    return trailSegmentHTML;
  }

  that.populateDetailPanel = function (content) {
    if (content) {
      $('#fpccDetailPanel').html(content)
    }
    that.setHeights()
    $('#closeDetail').off()
    $('#closeAbout').off()
    $('#useCloseDetail').off()
    $('#useCloseAbout').off()
    $('.detailPanelBanner').off()
    if (Config.isEdge) {
      $('#useCloseDetail').on('mousedown touchstart', events.closeDetailPanel)
      $('#useCloseAbout').on('mousedown touchstart', that.closeAboutPage)
    } else {
      $('#closeDetail').on(Config.listenType, events.closeDetailPanel)
      $('#closeAbout').on(Config.listenType, that.closeAboutPage)
    }
    if (that.SMALL) {
      $('.detailPanelBanner').on(Config.listenType, detailPanelBannerClick)
    }
  }

  that.slideDetailPanel = function (expand) {
    console.log('slideDetailPanel')
    if (that.SMALL) {
      if (expand) {
        console.log('[slideDetailPanel] expand = true')
        $('#fpccDetailPanel').addClass('expanded').removeClass('contracted')
        $('#fpccTrailListColumn').addClass('expanded').removeClass('contracted')
        if ($('#fpccMobileCheckbox').is(':checked')) {
          document.getElementById('fpccSearchBack').innerHTML = '<a><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg> Back to Map</a>'
        } else {
          document.getElementById('fpccSearchBack').innerHTML = '<a><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg> Back to List</a>'
        }
        $('#fpccSearchBack').show()
        $('#fpccMainContainer').hide()
        $('#fpccMobileSearchButton').hide()
      } else {
        console.log('[showDetailPanel] expand = false')
        $('#fpccDetailPanel').addClass('contracted').removeClass('expanded')
        $('.trailListColumn').addClass('contracted').removeClass('expanded')
        $('#fpccSearchBack').hide()
        $('#fpccMainContainer').show()
        $('#fpccMobileSearchButton').show()
      }
      that.setHeights()
    } else {
      $('#fpccSearchBack').html('<a><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg> Back to List</a>')
      $('#fpccSearchBack').show()
    }
  }

  that.toggleDetailPanel = function (action) {
    console.log('toggleDetailPanel')
    if (action === 'open') {
      $('#fpccSearchResults').hide()
      $('#fpccSearchStatus').hide()
      $('#fpccDetailPanel').show()
      $('#fpccPreserveInfo').scrollTop(0)
      if (that.SMALL) {
        $('#fpccMainContainer').hide()
      }
    } else if (action === 'close') {
      $('#fpccDetailPanel').hide()
      $('#fpccSearchBack').hide()
      $('#fpccSearchResults').show()
      $('#fpccSearchStatus').show()
      that.showfpccMainContainer()
      if (that.SMALL) {
        $('#fpccMainContainer').show()
      }
      changePageTitle(null)
      that.addSearchURL()
      that.currentDetailPanelHTML = ''
      that.setHeights()
    }
  }

  that.addSearchURL = function () {
    console.log('[readdSearchURL] start')
    $.address.parameter('trail', null)
    $.address.parameter('poi', null)
    var searchValue = filters.current.search.slice(0)
    if (filters.current.zipMuniFilter) {
      searchValue.push(filters.current.zipMuniFilter)
    }
    if (filters.current.hasAlerts) {
      searchValue.push('hasAlerts')
    }
    console.log('[readdSearchURL] searchValue = ' + searchValue)
    var searchLink =  encodeURIComponent(searchValue)
    searchLink = searchLink.replace(/%20/g, '+')
    console.log('[readdSearchURL] searchLink = ' + searchLink)
    $.address.parameter('search', searchLink)
    $.address.update()
  }

  that.toggleResultsList = function (action) {
    console.log('toggleResultsList action = ' + action)
    if (action === 'open') {
      $('#fpccSearchStatus').show()
      $('#fpccSearchResults').show()
      $('#fpccSearchBack').hide()
    } else if (action === 'close') {
      $('#fpccSearchStatus').hide()
      $('#fpccSearchResults').hide()
      // $('#fpccSearchBack').show()
    }
  }

  that.showfpccMainContainer = function (e) {
    console.log('showfpccMainContainer')
    var showMap = $('#fpccMobileCheckbox').is(':checked')
    console.log('[showfpccMainContainer] show = ' + showMap)
    if (showMap) {
      $('#fpccMainContainer').addClass('contracted').removeClass('expanded')
      $('.trailListColumn').addClass('contracted').removeClass('expanded')
      $('#fpccDetailPanel').addClass('contracted').removeClass('expanded')
      // document.getElementById("fpccMainContainer").style.zIndex = "1";
      $('#fpccSearchBack').hide()
      $('#fpccMainContainer').show()
      if ($('#fpccDetailPanel').is(':visible')) {
        $('#fpccMobileSearchButton').show()
      } else {
        $('#fpccMobileSearchButton').hide()
      }
    } else {
      $('#fpccMainContainer').addClass('expanded').removeClass('contracted')
      $('.trailListColumn').addClass('expanded').removeClass('contracted')
      $('#fpccDetailPanel').addClass('expanded').removeClass('contracted')
      $('#fpccMobileSearchButton').hide()
      $('#fpccSearchBack').html('<a><svg class="icon icon-arrow"><use xlink:href="icons/defs.svg#icon-arrow"></use></svg> Back to List</a>')
      if ($('#fpccDetailPanel').is(':visible')) {
        $('#fpccSearchBack').show()
        $('#fpccMainContainer').hide()
      } else {
        $('#fpccMainContainer').show()
      }
    }
    // setHeights();
  }

  var changePageTitle = function (name) {
    var newTitle = 'Map: Forest Preserves of Cook County'
    if (name) {
      // document.title = "Map: " + name + " | Forest Preserves of Cook County"
      newTitle = 'Map: ' + name + ' | Forest Preserves of Cook County'
    } else {
      // document.title = "Map: Forest Preserves of Cook County"
      newTitle = 'Map: Forest Preserves of Cook County'
    }
    $.address.title(newTitle)
    $.address.update()
  }

  var detailPanelBannerClick = function (e) {
    console.log('detailPanelBannerClick')
    if ($(e.target).parents('#fpccDetailPanel').is(':visible')) {
      if ($(e.target).parents('#fpccDetailPanel').hasClass('contracted')) {
        console.log('[detailPanelBannerClick] parent has contracted. Run slideDetailPanel2(false)')
        that.slideDetailPanel(true)
      } else {
        console.log('[detailPanelBannerClick] parent does not have contracted')
        that.slideDetailPanel(false)
      }
    }
  }

  var METERSTOMILESFACTOR = 0.00062137
  function metersToMiles (i) {
    return (i * METERSTOMILESFACTOR).toFixed(1)
  }

  return that
}

module.exports = {
  setup: setup,
  panelFuncs: panelFuncs
}
