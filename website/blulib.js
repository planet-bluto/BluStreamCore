// BLUTO LIBRARY //

class Elem {
	constructor(arg) {
		this._prevEvents = {}
		this.observers = []

		if (typeof arg == "string") {
			this.elem = document.getElementById(arg)
			if (this.elem == null) {
				this.elem = document.createElement(arg)
			}
		} else {
			this.elem = arg
		}

		this.classes = {
			add: arg => {
				this.elem.classList.add(arg)
			},
			remove: arg => {
				this.elem.classList.remove(arg)
			},
		}
	}

	// METHODS //

	delete() {
		this.elem.remove()
	}

	on(events, callback) {
		if (!Array.isArray(events)) {events = [events]}
		events.forEach(event => {
			if (!Array.isArray(this._prevEvents[event])) { this._prevEvents[event] = [] }
			this._prevEvents[event].push(callback)
			// print(this._prevEvents)
			this.elem.addEventListener(event, callback)
		})
	}

	notOn(events, ind = null) {
		if (!Array.isArray(events)) {events = [events]}
		events.forEach(event => {
			if (this._prevEvents[event] != null) {
				if (ind == null) {
					this._prevEvents[event].forEach(callback => {
						this.elem.removeEventListener(event, callback)
						this._prevEvents[event].remove(0)
					})
				} else {
					this.elem.removeEventListener(event, this._prevEvents[event][ind])
					this._prevEvents[event].remove(ind)
				}
			}
		})
	}

	watch(opts, func) {
		var observer = new MutationObserver((mutations, thisObserver) => {
			mutations.forEach(func)
		})

		observer.observe(this.elem, opts)

		this.observers.push(observer)

		return (this.observers.length-1)
	}

	unWatch(ind) {
		var observer = this.observers[ind]
		observer?.disconnect()
	}

	clear() {
		this.elem.replaceChildren()
	}

	addChild(child) {
		this.elem.appendChild(child.elem)
	}

	moveChild(oldI, newI) {
		var childs = this.elem.children
		// oldI = clamp(oldI, 0, this.elem.children.length-1)
		// newI = clamp(newI, 0, this.elem.children.length-1)

		var real_newI = (newI > oldI ? newI+1 : newI)

		if (real_newI < childs.length) {
			this.elem.insertBefore(childs[oldI], childs[real_newI])
		} else {
			this.elem.appendChild(childs[oldI])
		}
	}

	// SPECIAL VALUES //

    set id(val) {
        this.elem.id = val;
    }

    get id() {
        return this.elem.id;
    }

    set text(val) {
        this.elem.textContent = val;
    }

    get text() {
        return this.elem.textContent;
    }

    set src(val) {
        this.elem.src = val;
    }

    get src() {
        return this.elem.src;
    }

    set value(val) {
        this.elem.value = val;
    }

    get value() {
        return this.elem.value;
    }

    set html(val) {
        this.elem.innerHTML = val;
    }

    get html() {
        return this.elem.innerHTML;
    }

    set style(val) {
        this.elem.style = val;
    }

    get style() {
        return this.elem.style;
    }

    setAttr(key, val) {
        this.elem.setAttribute(key, val)
    }

    getAttr(key) {
        return this.elem.getAttribute(key);
    }

    hasAttr(key) {
        return this.elem.hasAttribute(key);
    }

    get width() {
    	return this.elem.getBoundingClientRect().height
    }

    get height() {
    	return this.elem.getBoundingClientRect().height
    }

    get children() {
        return Array.from(this.elem.children).map(element => new Elem(element));
    }

    set href(val) {
    	this.elem.setAttribute("href", val)
    }

    get href() {
    	this.elem.getAttribute("href")
    }
}

const InputFields = {
	text: () => {
		let elem = new Element("input")
		elem.setAttribute("type", "text")
		elem.value = () => {
			return elem.value
		}
		return elem
	},
	number: (...args) => {
		let elem = new Element("input")
		elem.setAttribute("type", "number")
		elem.setAttribute("min", args[0])
		elem.setAttribute("max", args[1])
		elem.value = () => {
			return elem.value
		}
		return elem
	},
}

class InputPrompt {
	constructor(arg) {
		Object.keys(arg).forEach(key => {
			let info = arg[key]
		})
	}
}

class ConfirmPrompt {
	constructor(args) {
		this.something = null
	}
}

function getClass(arg) {
	let return_arr = []
	 Array.from(document.getElementsByClassName(arg)).forEach(elem => {
	 	return_arr.push(new Elem(elem))
	 })
	return return_arr
}

function InputLink(elem) {

}

// CONSTANTS //

// const print = (...args) => { socket.emit("print", ...args); console.log(...args) }
const print = console.log
const body = new Elem(document.body)

// UTILITIES //

const repeat = (n, func) => {
	for (var i = 0; i < n; i++) {
		func(i)
	}
}

const wait = (ms) => {
	return new Promise((res, rej) => {
		setTimeout(() => {
			res()
		}, ms)
	})
}

function randiRange(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
}

/// ARRAYS ///

Array.prototype.awaitForEach = async function(func) {
	var proms = []

	this.forEach((...args) => {
		proms.push(func(...args))
	})

	return await Promise.all(proms)
}

Array.prototype.asyncForEach = async function(func) {
	var i = 0
	var length = this.length
	var funcs = []
	var reses = []
	return new Promise(async (res, rej) => {
		this.forEach((...args) => {
			funcs.push(func.bind(this, ...args))
		})

		async function loop() {
			var this_res = await funcs[i]()
			reses.push(this_res)
			i++
			if (i == length) {
				res(reses)
			} else {
				loop()
			}
		}
		loop()
	})
}

Array.prototype.shuffle = function () {
  let currentIndex = this.length,  randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {

    // Pick a remaining element...
    randomIndex = randiRange(0, currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [this[currentIndex], this[randomIndex]] = [
      this[randomIndex], this[currentIndex]];
  }
}

Array.prototype.insert = function (index, value) {
	this.splice(index, 0, value)
}

Array.prototype.insertArr = function (index, arr) {
	this.splice(index, 0, ...arr)
}

Array.prototype.move = function (old_index, new_index) {
    // if (new_index >= this.length) {
    //     var k = new_index - this.length + 1;
    //     while (k--) {
    //         this.push(undefined);
    //     }
    // }
    // new_index = Math.min(new_index, this.length-1)
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
}

Array.prototype.random = function () {
	if (this.length == 0) {
		return null
	} else {
		return this[randi(0, this.length-1)]
	}
}

Array.prototype.remove = function (ind) {
	if (ind < this.length-1) {
		return this.splice(ind, 1)[0]
	} else {
		return this.pop()
	}
}

Array.prototype.last = function () {
	return this[this.length-1]
}

// function lerp( a, b, alpha ) {
// 	return (a + alpha * ( b - a ))
// }

function clamp(val, min, max) {
	return Math.min(Math.max(val, min), max)
}

function lerp( a, b, alpha ) {
	return (a + alpha * ( b - a ))
}

var active_tweens = []
function tween(duration, easingFunc, func, anim = true, FPS = 144) {
	const frameWait = func => { setTimeout(func, (1000 / FPS)) }
	var frameFunc = (anim ? requestAnimationFrame : frameWait)

	var int = active_tweens.length
	active_tweens.push(new Promise((res, rej) => {
		var start = null
		function main(curr = Date.now()) {
			if (start == null) {
				start = curr
			}
			var progressMS = (curr - start)
			var progressPerc = (progressMS / duration)
			var perc = easingFunc(progressPerc)

			if (active_tweens[int] != false) {
				if (progressPerc >= 1) {
					perc = 1
					endTween()
				} else {
					frameFunc(main)
				}
				func(perc)
			} else {
				// print("CANCELED")
				endTween()
			}

			function endTween() {
				active_tweens[int] = false
				res(true)
			}
		}
		frameFunc(main)
	}))

	return int
}

function awaitTween(tween_int) {
	var active_tween = active_tweens[tween_int]
	if (active_tween) {
		return active_tween
	} else {
		return null
	}
}

function cancelTween(tween_int) {
	active_tweens[tween_int] = false
}

function cancelAllTweens() {
	for (var i = active_tweens.length - 1; i >= 0; i--) {
		active_tweens[i] = false
	}
}

function EASE_LINEAR(x) {
	return x
}

function EASE_OUT_QUART(x) {
	return 1 - Math.pow(1 - x, 4)
}

function EASE_OUT_BOUNCE(x) {
	const n1 = 7.5625;
	const d1 = 2.75;

	if (x < 1 / d1) {
	    return n1 * x * x;
	} else if (x < 2 / d1) {
	    return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
	    return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
	    return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
}

function EASE_IN_BOUNCE(x) {
	return 1 - EASE_OUT_BOUNCE(1 - x)
}

function EASE_IN_OUT_BOUNCE(x) {
	return (x < 0.5
	  ? (1 - EASE_OUT_BOUNCE(1 - 2 * x)) / 2
	  : (1 + EASE_OUT_BOUNCE(2 * x - 1)) / 2)
}

function EASE_OUT_BACK(x) {
	const c1 = 1.70158;
	const c3 = c1 + 1;

	return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// function EASE_OUT_BOUNCE(x) {
// 	const n1 = 7.5625;
// 	const d1 = 2.75;

// 	if (x < 1 / d1) {
// 	    return n1 * x * x;
// 	} else if (x < 2 / d1) {
// 	    return n1 * (x -= 1.5 / d1) * x + 0.75;
// 	} else if (x < 2.5 / d1) {
// 	    return n1 * (x -= 2.25 / d1) * x + 0.9375;
// 	} else {
// 	    return n1 * (x -= 2.625 / d1) * x + 0.984375;
// 	}
// }