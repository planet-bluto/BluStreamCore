// const SOUNDS = {

// }

// const EXPRESSIONS = {

// }

socket.on("connect", async () => {
  print("Greetings...")
  await socket.emitWithAck("sub_control_panel")

  socket.emit("request_artists")
  socket.emit("request_popups")
  socket.emit("request_emotes")

  print("getting shit...")
})

var timeoutsDiv = new Elem("timeouts")
socket.on("chatter_push", userObj => {
  var this_button = makeSlotButton(userObj.username, (e) => {
    var result = null
    var once = false
    while (!once || (result.length > 0 && Number.isNaN(Number(result)))) {
      result = prompt(`Are you sure you want to timeout '${userObj.username}'?`, "10")
      once = true
      if (result == null) { break }
    }
    if (result != null) {
      var duration = (result == "" ? null : Number(result))
      socket.emit("chatter_timeout", userObj.id, duration)
      print(`> TIMING OUT ${userObj.id} for ${duration}`)
    }
  })

  timeoutsDiv.addChild(this_button)

  var scrollDist = Math.abs((timeoutsDiv.elem.scrollTop + timeoutsDiv.elem.clientHeight) - timeoutsDiv.elem.scrollHeight)
  print(scrollDist)
  if (scrollDist < 50) {
    timeoutsDiv.elem.scrollTop = timeoutsDiv.elem.scrollHeight
  }
})

var shoutoutsInput = new Elem("shoutouts-input")
var shoutoutsButton = new Elem("shoutouts-button")
var shoutoutsList = new Elem("shoutouts-list")
socket.on("artists_received", artists => {
  shoutoutsList.clear()
  artists.forEach(artist => {
    // print(artist.id)
    if (artist.id == null || artist.id == "") { return }
    var this_elem = new Elem("option")
    this_elem.elem.value = artist.id
    this_elem.text = artist.name

    shoutoutsList.addChild(this_elem)
  })
})

shoutoutsButton.on("click", e => {
  socket.emit("shoutout", shoutoutsInput.value)
})

var popupInput = new Elem("popup-input")
var popupButton = new Elem("popup-button")
var popupList = new Elem("popup-list")
socket.on("popups_received", (popups) => {
  popupList.clear()
  Object.values(popups).forEach(popup_info => {
    var this_elem = new Elem("option")
    this_elem.elem.value = popup_info.id
    this_elem.text = popup_info.title

    popupList.addChild(this_elem)
  })
})

popupButton.on("click", e => {
  socket.emit("spawn_popup", popupInput.value)
})

function makeSlotButton(text, clickEvent) {
  var this_button = new Elem("button")

  this_button.text = text
  this_button.classes.add("slot-button")

  this_button.on("click", clickEvent)

  return this_button
}

var start_stream_button = new Elem("stream-start-button")

start_stream_button.on("click", e => {
  var actually = confirm(`Are you sure you want to start the stream?`)
  if (actually) {
    socket.emit("stream_start")
  }
})

new Elem("end-screen-button").on("click", e => {
  let actually = confirm(`Are you sure you want to start the end screen?`)
  if (actually) {
    socket.emit("start_end_screen")
  }
})

//// PINGAS //////////////////////////////////////

var video_elem = new Elem("PREVIEW_VIDEO")

var zoomInput = new Elem("zoom-input")
var zoomInputCTX = zoomInput.elem.getContext("2d")
var zoomPreview = new Elem("zoom-preview")
var zoomPreviewCTX = zoomPreview.elem.getContext("2d")

zoomInput.elem.width = 1920
zoomInput.elem.height = 1080
zoomPreview.elem.width = 1920
zoomPreview.elem.height = 1080

const options = {audio: false, video: true}
navigator.mediaDevices.getDisplayMedia(options).then(handleSuccess, handleError)


function handleSuccess(stream) {
  video_elem.elem.srcObject = stream
  video_elem.elem.play()
}

function getZoomBounds() {
  var zoomBounds = {
    x: (zoomTransform.x - ((1920 * zoomTransform.scale) / 2)),
    y: (zoomTransform.y - ((1080 * zoomTransform.scale) / 2)),
    w: 1920 * zoomTransform.scale,
    h: 1080 * zoomTransform.scale,
  }

  return zoomBounds
}

var zoomTransform = {x: 1920/2, y: 1080/2, scale: 1.0}
function drawFrame() {
  var zoomBounds = getZoomBounds()
  var obsBounds = getOBSZoomBounds()

  zoomInputCTX.drawImage(video_elem.elem, 0, 0, 1920, 1080)
  zoomPreviewCTX.drawImage(video_elem.elem, obsBounds.x, obsBounds.y, obsBounds.w, obsBounds.h)

  zoomInputCTX.fillStyle = "#024aca7c"
  zoomInputCTX.fillRect(zoomBounds.x, zoomBounds.y, zoomBounds.w, zoomBounds.h)

  requestAnimationFrame(drawFrame)
}

zoomInput.on("wheel", e => {
  var scroll_amount = (-e.deltaY / 4000)
  zoomTransform.scale += scroll_amount
  zoomTransform.scale = clamp(zoomTransform.scale, 0.25, 1.0)

  var zoomBounds = getZoomBounds()

  if (zoomBounds.x < 0) { zoomTransform.x += Math.abs(zoomBounds.x) }
  if (zoomBounds.x+zoomBounds.w > 1920) { zoomTransform.x += (1920-(zoomBounds.x+zoomBounds.w)) }
  if (zoomBounds.y < 0) { zoomTransform.y += Math.abs(zoomBounds.y) }
  if (zoomBounds.y+zoomBounds.h > 1080) { zoomTransform.y += (1080-(zoomBounds.y+zoomBounds.h)) }

  print(zoomTransform)
})

var mouse_moving = false
var init_pos = {x: 0, y: 0}
var init_zoom_pos = {x: zoomTransform.x, y: zoomTransform.y}
zoomInput.on("mousedown", e => { mouse_moving = true; init_pos = {x: e.offsetX, y: e.offsetY}; init_zoom_pos = {x: zoomTransform.x, y: zoomTransform.y} })
zoomInput.on("mouseup", e => { mouse_moving = false; sendOBSZoom() })

zoomInput.on("mousemove", e => {
  if (mouse_moving) {
    var bounds = zoomInput.elem.getBoundingClientRect()
    var pos_scale = (1920 / bounds.width)

    var new_pos = {x: e.offsetX, y: e.offsetY}
    var pos_diff = {x: new_pos.x - init_pos.x, y: new_pos.y - init_pos.y}

    zoomTransform.x = (init_zoom_pos.x + (pos_diff.x * pos_scale))
    zoomTransform.x = clamp(zoomTransform.x, (1920*zoomTransform.scale/2), 1920-(1920*zoomTransform.scale/2))
    zoomTransform.y = (init_zoom_pos.y + (pos_diff.y * pos_scale))
    zoomTransform.y = clamp(zoomTransform.y, (1080*zoomTransform.scale/2), 1080-(1080*zoomTransform.scale/2))
  }
})

drawFrame()

function getOBSZoomBounds() {
  var zoomBounds = getZoomBounds()

  return {
    x: -(zoomBounds.x * (1 / zoomTransform.scale)),
    y: -(zoomBounds.y * (1 / zoomTransform.scale)),
    w: 1920 * (1 / zoomTransform.scale),
    h: 1080 * (1 / zoomTransform.scale),
  }
}

var zoom_button = new Elem("zoom-button")
zoom_button.on("click", e => {
  sendOBSZoom()
})

function sendOBSZoom() {
  var thisBounds = getOBSZoomBounds()
  socket.emit("obs_zoom", thisBounds)
}

function handleError(err) { // :)
  print(err)
}


// new Elem("")

// ----------------------------------------------------- //

new Elem("stream-form-header").on("change", e => {
  print("set_header: ", e.target.value)
  socket.emit("set_header", e.target.value)
})

new Elem("stream-form-header-emote").on("change", e => {
  print("set_header_emote: ", e.target.value)
  socket.emit("set_header_emote", e.target.value)
  
  e.target.value = ""
})

new Elem("stream-form-title").on("change", e => {
  print("set_title: ", e.target.value)
  socket.emit("set_title", e.target.value)
})

new Elem("stream-form-category-search").on("change", async e => {
  var categories = await socket.emitWithAck("category_search", e.target.value)
  print(categories)

  let search_results_select = new Elem("stream-form-category-search-results")
  search_results_select.clear()

  categories.forEach(category => {
    let thisElem = new Elem("option")
    thisElem.elem.value = category.id
    thisElem.text = category.name
    search_results_select.addChild(thisElem)
  })
})

new Elem("stream-form-category-select").on("change", e => {
  var selection = e.target.selectedOptions[0]
  socket.emit("set_category", selection.value)
})

socket.emitWithAck("get_title_header").then((res) => {
  print(res)
  new Elem("stream-form-header").elem.value = res.header
  new Elem("stream-form-title").elem.value = res.title
})

// ----------------------------------------------------- //

socket.on("emotes_received", emotes => {
  let emote_list = new Elem("stream-form-header-emote-list")
  emote_list.clear()

  emotes.forEach(emote => {
    let emoteElem = new Elem("option")
    emoteElem.value = emote
    emoteElem.text = emote

    emote_list.addChild(emoteElem)
  })
})