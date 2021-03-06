'use strict';

const utils = require('../core/utils');

module.exports = class BaseKernel {

	/**
	 * @constructor BaseKernel
	 * 
	 * @desc Implements the base class for Kernels, and is used as a 
	 * parent class for all Kernel implementations.
	 *
	 * This contains the basic methods needed by all Kernel implementations, 
	 * like setDimensions, addSubKernel, etc.
	 * 
	 * @prop {Array} paramNames - Name of the parameters of the kernel function
	 * @prop {String} fnString - Kernel function as a String
	 * @prop {Array} dimensions - Dimensions of the kernel function, this.thread.x, etc.
	 * @prop {Boolean} debug - Toggle debug mode
	 * @prop {String} graphical - Toggle graphical mode
	 * @prop {number} loopMaxIterations - Maximum number of loop iterations
	 * @prop {Object} constants - Global constants
	 * @prop {Array} subKernels - Sub kernels bound to this kernel instance
	 * @prop {Object} subKernelProperties - Sub kernels bound to this kernel instance as key/value pairs
	 * @prop {Array} subKernelOutputVariableNames - Names of the variables outputted by the subkerls
	 *
	 */
	constructor(fnString, settings) {
		this.paramNames = utils.getParamNamesFromString(fnString);
		this.fnString = fnString;
		this.dimensions = [];
		this.debug = false;
		this.graphical = false;
		this.loopMaxIterations = 0;
		this.constants = null;
		this.wraparound = null;
		this.hardcodeConstants = null;
		this.outputToTexture = null;
		this.texSize = null;
		this._canvas = null;
		this._webGl = null;
		this.threadDim = null;
		this.floatTextures = null;
		this.floatOutput = null;
		this.floatOutputForce = null;
		this.addFunction = null;
		this.copyData = true;
		this.subKernels = null;
		this.subKernelProperties = null;
		this.subKernelNames = null;
		this.subKernelOutputVariableNames = null;

		for (let p in settings) {
			if (!settings.hasOwnProperty(p) || !this.hasOwnProperty(p)) continue;
			this[p] = settings[p];
		}
		if (settings.hasOwnProperty('canvas')) {
			this._canvas = settings.canvas;
		}

		if (!this._canvas) this._canvas = utils.initCanvas();
	}

	build() {
		throw new Error('"build" not defined on Base');
	}

	setAddFunction(cb) {
		this.addFunction = cb;
		return this;
	}

	/**
	 * @memberOf BaseKernel#
	 * @function
	 * @name setDimensions
	 *
	 * @desc Set dimensions of the kernel function
	 *
	 * @param {Array} dimensions - The dimensions array set the dimensions to
	 *
	 */
	setDimensions(dimensions) {
		this.dimensions = dimensions;
		return this;
	}

	/**
	 * @memberOf BaseKernel# 
	 * @function
	 * @name setDebug
	 *
	 * @desc Toggle debug mode
	 *
	 * @param {Boolean} flag - true to enable debug
	 *
	 */
	setDebug(flag) {
		this.debug = flag;
		return this;
	}

	/**
	 * @memberOf BaseKernel#
	 * @function
	 * @name setGraphical
	 *
	 * @desc Toggle graphical output mode
	 *
	 * @param {Boolean} flag - true to enable graphical output
	 *
	 */
	setGraphical(flag) {
		this.graphical = flag;
		return this;
	}

	/**
	 * @memberOf BaseKernel#
	 * @function
	 * @name setLoopMaxIterations
	 *
	 * @desc Set the maximum number of loop iterations
	 *
	 * @param {number} max - iterations count
	 *
	 */
	setLoopMaxIterations(max) {
		this.loopMaxIterations = max;
		return this;
	}

	/**
	 * @memberOf BaseKernel#
	 * @function
	 * @name setConstants
	 * @desc Set Constants
	 */
	setConstants(constants) {
		this.constants = constants;
		return this;
	}

	setWraparound(flag) {
		console.warn('Wraparound mode is not supported and undocumented.');
		this.wraparound = flag;
		return this;
	}

	setHardcodeConstants(flag) {
		this.hardcodeConstants = flag;
		return this;
	}

	setOutputToTexture(flag) {
		this.outputToTexture = flag;
		return this;
	}

	/**
	 * @memberOf BaseKernel#
	 * @function
	 * @name setFloatTextures
	 *
	 * @desc Toggle texture output mode
	 *
	 * @param {Boolean} flag - true to enable floatTextures
	 *
	 */
	setFloatTextures(flag) {
		this.floatTextures = flag;
		return this;
	}

	/**
	 * @memberOf BaseKernel#
	 * @function
	 * @name setFloatOutput
	 *
	 * @desc Toggle output mode
	 *
	 * @param {Boolean} flag - true to enable float
	 *
	 */
	setFloatOutput(flag) {
		this.floatOutput = flag;
		return this;
	}

	setFloatOutputForce(flag) {
		this.floatOutputForce = flag;
		return this;
	}

	/**
	 * @memberOf BaseKernel#
	 * @function
	 * @name setCanvas
	 *
	 * @desc Bind the canvas to kernel
	 * 
	 * @param {Canvas} canvas - Canvas to bind
	 *
	 */
	setCanvas(canvas) {
		this._canvas = canvas;
		return this;
	}

	/**
	 * @memberOf BaseKernel#
	 * @function
	 * @name setCanvas
	 *
	 * @desc Bind the webGL instance to kernel
	 * 
	 * @param {Canvas} webGL - webGL instance to bind
	 *
	 */
	setWebGl(webGl) {
		this._webGl = webGl;
		return this;
	}

	setCopyData(copyData) {
		this.copyData = copyData;
		return this;
	}

	/**
	 * @memberOf BaseKernel#
	 * @function
	 * @name getCanvas()
	 *
	 * @desc Returns the current canvas instance bound to the kernel
	 *
	 */
	getCanvas() {
		return this._canvas;
	}

	/**
	 * @memberOf BaseKernel#
	 * @function
	 * @name getWebGl()
	 *
	 * @desc Returns the current webGl instance bound to the kernel
	 *
	 */
	getWebGl() {
		return this._webGl;
	}

	validateOptions() {
		throw new Error('validateOptions not defined');
	}

	exec() {
		return this.execute.apply(this, arguments);
	}

	execute() {
		//
		// Prepare the required objects
		//
		const args = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));

		//
		// Setup and return the promise, and execute the function, in synchronous mode
		//
		return utils.newPromise((accept, reject) => {
			try {
				accept(this.run.apply(this, args));
			} catch (e) {
				//
				// Error : throw rejection
				//
				reject(e);
			}
		});
	}

	/** 
	 * @memberOf BaseKernel#
	 * @function
	 * @name addSubKernel
	 *
	 * @desc Add a sub kernel to the root kernel instance.
	 * This is what `createKernelMap` uses.
	 *
	 * @param {String} fnString - function (as a String) of the subKernel to add
	 *
	 */
	addSubKernel(fnString) {
		if (this.subKernels === null) {
			this.subKernels = [];
			this.subKernelNames = [];
		}
		this.subKernels.push(fnString);
		this.subKernelNames.push(utils.getFunctionNameFromString(fnString));
		return this;
	}

	/** 
	 * @memberOf BaseKernel#
	 * @function
	 * @name addSubKernelProperty
	 *
	 * @desc Add a sub kernel to the root kernel instance, indexed by a property name
	 * This is what `createKernelMap` uses.
	 *
	 * @param {String} property - property key for the subKernel
	 * @param {String} fnString - function (as a String) of the subKernel to add
	 *
	 */
	addSubKernelProperty(property, fnString) {
		if (this.subKernelProperties === null) {
			this.subKernelProperties = {};
			this.subKernelNames = [];
		}
		if (this.subKernelProperties.hasOwnProperty(property)) {
			throw new Error(`cannot add sub kernel ${ property }, already defined`);
		}
		this.subKernelProperties[property] = fnString;
		this.subKernelNames.push(utils.getFunctionNameFromString(fnString));
		return this;
	}
};