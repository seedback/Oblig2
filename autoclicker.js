// ##########################
// ###										###
// ###       MODEL        ###
// ###										###
// ##########################

var model = {
	defaultPointsPerClick: 1,

	points: undefined, // The amount of points the player has
	pointsPerClick: undefined, // The amount of points the player gets per click
	smileyIndex: undefined, // The index of which smiley/emoji to use at any
	// given time(changes every time the
	// click-target (emoji) gets clicked)

	// Used to store the average amount of clicks per seconds over the last 10 seconds
	numClickTimesStored: 10, // Defines the amount of clicks to be stored
	clicksPerSecond: undefined,
	lastClicksSeconds: [], // Stores the time in seconds for the last x amount of click: undefined,
	lastClickTime: undefined, // The last time in Date.getTime ms used t: und:,ned,
	// calculate the time the last cli:: undefined,ook

	autoClicksPerSecond: undefined, // Is affected by pointsPerClick (Workstation upgrades and similar)
	autoPointsPerSecond: undefined, // Is NOT affected by pointsPerClick (Workstation upgrades and similar)
	autoClickTimerID: undefined,

	// Workstations 
	workstationDefaultPrice: 10,
	workstationWorkIncrease: 0.1, // The the amount of more points you get per click, per upgrade
	workstationPriceIncrease: 2, // The amount the price increases each time it is bought
	workstationDiscounts: [5, 20], // List of the different discount levels for
	// buying workstations [0] = 1 workstation, [1] = 5 workstations, [2] = 10 workstations, [3] = 50 workstations, [4] = 100 workstations
	numWorkstations: undefined, // Counter for number of upgrades
	priceOfWorkstation: undefined, // The current price for an upgrde
	// By having workstationPriceIncrease bigger than (1 / workstationWorkIncrease) the amount of
	// clicks per upgrade also increases per upgrade bought, thus incentivising
	// autoclickers more


	friendDefaultPrice: 100,
	friendWorkIncrease: 0.2, // How many more autoclicks per second per upgrade
	friendPriceIncrease: 5, // The amount the price increases each time it is bought
	friendDiscounts: [120, 240], // List of the different discount levels for
	// buying friends [0] = 1 friend, [1] = 5 friends, [2] = 10 friends, [3] = 50 friends, [4] = 100 friends
	numFriends: undefined, // Counter for number of upgrades
	priceOfFriend: undefined, // The current price for an upgrde
	// By having friendWorkIncrease bigger than (1 / friendWorkIncrease) the amount of
	// clicks per upgrade also increases per upgrade bought, thus incentivising
	// later upgrades more

	currentName: '',
	scoreboard: [],
}

// ##########################
// ###										###
// ###     CONTROLER      ###
// ###										###
// ##########################

// Handles the clicking on the click-target (the emoji)
function doClick() {
	model.points = addWithToFixed(model.points, model.pointsPerClick);
	calculateClicksPerSecond();
	model.smileyIndex = getNextSmileyIndex(model.smileyIndex);
	updateView();
}

function buyWorkstation(number, discount) {
	let totalCost = costOfMultipleUpgrades(model.priceOfWorkstation,
		model.workstationPriceIncrease, number, discount);

	// Escapes if you don't have enough points
	if (model.points < totalCost) return false;
	// Updates the new score
	// Uses addWithToFixed() to fix rounding errors caused by Javascript, and
	// also make the numbers more readable
	// (without a 3rd parameter it returns a number with 1 decimal)
	model.points = addWithToFixed(model.points, -totalCost);

	// Updates the differents stats
	model.pointsPerClick += model.workstationWorkIncrease * number;
	model.numWorkstations += number;
	model.priceOfWorkstation += (model.workstationPriceIncrease * number);

	updateView();
	return true;
}

function buyFriend(number, discount) {
	let totalCost = costOfMultipleUpgrades(model.priceOfFriend,
		model.friendPriceIncrease, number, discount);

	// Escapes if you don't have enough points
	if (model.points < totalCost) return false;
	// Updates the new score
	// Uses addWithToFixed() to fix rounding errors caused by Javascript, and
	// also make the numbers more readable
	// (without a 3rd parameter it returns a number with 1 decimal)
	model.points = addWithToFixed(model.points, -totalCost);

	// Updates the differents stats
	model.autoClicksPerSecond += model.friendWorkIncrease * number;
	model.numFriends += number;
	model.priceOfFriend += (model.friendPriceIncrease * number);

	startAutoClicks();
	updateView();
	return true;
}

function submitScore() {
	model.scoreboard.push({
		name: (!model.currentName) ? '' : model.currentName,
		points: (!model.points) ? '' : model.points,
		pointsPerClick: (!model.pointsPerClick) ? '' : model.pointsPerClick,
		autoClicksPerSecond: (!model.autoClicksPerSecond) ? '' : model.autoClicksPerSecond,
		autoPointsPerSecond: (!model.autoPointsPerSecond) ? '' : model.autoPointsPerSecond,
	})
	updateView();
}

function resetGame() {
	clearInterval(model.autoClickTimerID);
	model.points = 0;
	model.pointsPerClick = model.defaultPointsPerClick;
	model.smileyIndex = -1;

	model.clicksPerSecond = 0;
	model.lastClicksSeconds = [];
	model.lastClickTime = (new Date).getTime();

	model.autoClicksPerSecond = 0;
	model.autoPointsPerSecond = 0;
	// Stopping the autoclicker, then setting the ID to 0 so it can be restarted normally
	model.autoClickTimerID = 0;

	model.priceOfWorkstation = model.workstationDefaultPrice;
	model.numWorkstations = 0;

	model.priceOfFriend = model.friendDefaultPrice;
	model.numFriends = 0;
	updateView();
}


// ##########################
// ###										###
// ###  HJELPEFUNKSJONER  ###
// ###										###
// ##########################
startAutoClicks(); // Starts with page load in case a save is loded or something and the player starts with autoclicks

function startAutoClicks() {
	if (model.autoClickTimerID) clearInterval(model.autoClickTimerID);
	if (model.autoClicksPerSecond > 0) {
		model.autoClickTimerID = setInterval(doClick, 1000 / model.autoClicksPerSecond);
	}
	else {
		model.autoClickTimerID = 0;
	}
}

// Gets the curent smiley dependent on the current index
function getSmiley(aSmileyIndex) {
	if (aSmileyIndex == -1) return '😐'; // Only to be used when the player hasn't clicked on it yet
	if (aSmileyIndex == 0) return '🙂';
	if (aSmileyIndex == 1) return '😃';
	if (aSmileyIndex == 2) return '😁';
	return '';
}

// Updates the smiley-index
function getNextSmileyIndex(aSmileyIndex) {
	const maxSmileyIndex = 2; // Equals the amount of smileys -1
	const minSmileyIndex = -1;

	// in case the index is too small it is set to the minimum value
	if (aSmileyIndex < minSmileyIndex) return minSmileyIndex;

	// Adds one to the index
	// and if more than maxSmileyIndex wraps around to 0
	aSmileyIndex++;
	if (aSmileyIndex > maxSmileyIndex) {
		aSmileyIndex = 0;
	}
	return aSmileyIndex;
}

// Adds two numbers with the added functionality of
// adjusting the decimal precision (default 1 decimal)
function addWithToFixed(x, y, precision = 1) {
	return parseFloat((x + y).toFixed(precision));
}

// Calculates the cost of buying multiple upgrades where the price of each
// upgrade increases with each purchase
// The discount is calculated based on the total price increase
function costOfMultipleUpgrades(baseCost, increase, number, discount = 0) {
	// Calculates the point increase, this used to be done with a for-loop but
	// could be solved mathematically which would be significantly faster (would
	// take about half the time or so) than the old loop-method (This statement
	// depends a bit on the implementation of Math.pow() but I expect the default
	// libraries to be at least somewhat optimized).
	let pointIncrease = (increase / 2) * Math.pow(number - 1, 2) +
		(increase / 2) * (number - 1);
	let totalCost = baseCost * number + pointIncrease;
	return totalCost - discount;
}

function calculateClicksPerSecond() {
	let newTime = (new Date).getTime();
	let totalSeconds = 0;

	// Add another delta time, in seconds, to the array lastClicksSeconds
	if (model.lastClickTime) {
		model.lastClicksSeconds.push(((newTime - model.lastClickTime) / 1000));
	}
	model.lastClickTime = newTime;
	// If the array lastClicksSeconds is too long, remove the first element
	model.lastClicksSeconds = model.lastClicksSeconds.slice(-model.numClickTimesStored);

	// Add up all times
	model.lastClicksSeconds.forEach(i => {
		totalSeconds += i;
	});

	// Get the average of all times
	model.clicksPerSecond = parseFloat((totalSeconds / model.lastClicksSeconds.length)).toFixed(3);
}

function calculateStatisticsOutput(num, msg1, msg2) {
	console.log();
	if (num == 0) return `0.000 ${msg1}`
	if (num >= 1) return `${num.toFixed(3)} ${msg2}`
	return `${(1 / num).toFixed(3)} ${msg1}`
}