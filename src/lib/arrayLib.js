Array.prototype.shuffle = function () {
	let currentIndex = this.length,  randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {

		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[this[currentIndex], this[randomIndex]] = [
			this[randomIndex], this[currentIndex]];
	}
}

Array.prototype.random = function () {
	let randomIndex = Math.floor(Math.random() * (this.length))
    return this[randomIndex]
}

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

Array.prototype.remove = function (ind) {
	if (ind < this.length-1) {
		return this.splice(ind, 1)[0]
	} else {
		return this.pop()
	}
}

Array.prototype.pat = function (entry) {
	var ind = this.indexOf(entry)
	if (ind == -1) {
		this.push(entry)
	} else {
		this[ind] = entry
	}
}

Array.prototype.remove_duplicates = function () {
	return this.filter((entry, ind) => this.indexOf(entry) == ind)
}