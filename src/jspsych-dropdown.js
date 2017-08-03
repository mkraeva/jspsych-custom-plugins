/**
 * jspsych-dropdown
 *
 * Based on jspsych-survey-multi-choice:
 * a jspsych plugin for multiple choice survey questions
 *
 * Shane Martin
 *
 * documentation: docs.jspsych.org
 *
 */

jsPsych.plugins['dropdown'] = (function () {
	var plugin = {};

	plugin.info = {
		name: 'dropdown',
		description: '',
		parameters: {
			select_multiple: {
				type: [jsPsych.plugins.parameterType.BOOL],
				array: true,
				default: false,
				no_function: false,
				description: 'Whether multiple choices can be selected'
			},
			questions: {
				type: [jsPsych.plugins.parameterType.STRING],
				array: true,
				default: undefined,
				no_function: false,
				description: ''
			},
			options: {
				type: [jsPsych.plugins.parameterType.STRING],
				array: true,
				default: undefined,
				no_function: false,
				description: ''
			},
			required: {
				type: [jsPsych.plugins.parameterType.BOOL],
				array: true,
				default: false,
				no_function: false,
				description: ''
			},
			preamble: {
				type: [jsPsych.plugins.parameterType.STRING],
				default: '',
				no_function: false,
				description: ''
			},
			superq: {
				type: [jsPsych.plugins.parameterType.STRING],
				default: '',
				no_function: false,
				description: ''
			}
		}
	}
	plugin.trial = function (display_element, trial) {
		var all_choice_objects = [];
		var plugin_id_name = "jspsych-dropdown";
		var _join = function (/*args*/) {
			var arr = Array.prototype.slice.call(arguments, _join.length);
			return arr.join(separator = '-');
		}

		// trial defaults
		trial.preamble = typeof trial.preamble == 'undefined' ? "" : trial.preamble;
		trial.superq = typeof trial.superq == 'undefined' ? false : trial.superq;
		trial.required = typeof trial.required == 'undefined' ? [] : trial.required;
		trial.select_multiple = typeof trial.select_multiple === 'undefined'? [] : trial.select_multiple;

		// inject CSS for trial

		// form element
		var trial_form_id = _join(plugin_id_name, "form");
		display_element.innerHTML += '<form id="' + trial_form_id + '"></form>';
		var trial_form = display_element.querySelector("#" + trial_form_id);
		// show preamble text
		var preamble_id_name = _join(plugin_id_name, 'preamble');
		trial_form.innerHTML += '<div id="' + preamble_id_name + '" class="' + preamble_id_name + '">' + trial.preamble + '</div>';

		// show superq text
		if (trial.superq) {
			var superq_id_name = _join(plugin_id_name, 'superq');
			trial_form.innerHTML += '<div id="' + superq_id_name + '" class="' + preamble_id_name + '">' + trial.superq + '</div>';
		}

		// helper functions for using the Choices library
		function buildQuestionChoicesId(questionIdx) {
			return _join(plugin_id_name, questionIdx, 'choices');
		}

		function initChoicesForQuestion(questionIdx) {
			var question_choices_selector = '#' + buildQuestionChoicesId(questionIdx);
			var choicesConfig = {
					shouldSort: false, // disable alphabetic sort, options should remain in the same order as in the trial parameter
					choices: trial.options[questionIdx].map(function (optionText) {
						return {
							label: optionText,
							value: optionText
						};
					})
			};
			if (trial.select_multiple[questionIdx]) {
				// add the placeholder for multiple selection questions in the Choices config
				// single-select questions are handled in the html directly because otherwise the answer is preselected
				choicesConfig.placeholder = true;
				choicesConfig.placeholderValue = 'Select option';
			}
			var question_choices = new Choices(question_choices_selector, choicesConfig);
			all_choice_objects[questionIdx] = question_choices;
		}

		// add multiple-choice questions
		for (var i = 0; i < trial.questions.length; i++) {
			// create question container
			// ID of the html element that will contain all choices for the current question
			var choices_id = buildQuestionChoicesId(i);
			var selection_type = trial.select_multiple[i] ? ' multiple' : '';
			var placeholder_text = 'Please choose an answer';
			var placeholder_html;
			if (trial.select_multiple[i]) {
				// placeholders for multiple select questions are set in the Choices configuration
				placeholder_html = '';
			} else {
				placeholder_html = '<option selected disabled value="">' + placeholder_text + '</option>';
			}
			var is_required = trial.required[i]? ' required': '';
			var select_html = '<select id="' + choices_id + '" name="' + choices_id + '"' + selection_type + is_required + '>' +
			placeholder_html + '</select>';
			trial_form.innerHTML += '<div><p class="' + plugin_id_name + '-text dropdown">' + trial.questions[i] + '</p>' + select_html + '</div>';

			setTimeout(initChoicesForQuestion.bind(null, i));
		}
		// add submit button
		trial_form.innerHTML += '<input type="submit" id="' + plugin_id_name + '-next" class="' + plugin_id_name + ' jspsych-btn" value="Next"></input>';

		trial_form.addEventListener('submit', function (event) {
			event.preventDefault();
			// measure response time
			var endTime = (new Date()).getTime();
			var response_time = endTime - startTime;

			// create object to hold responses
			var question_data = {};
			for (var i = 0; i < all_choice_objects.length; i++) {
				var qid = "Q" + i;
				var aid = "A" + i;
				question_choices = all_choice_objects[i];
				question_data[qid] = trial.questions[i];
				// extract the selected value(s)
				question_data[aid] = question_choices.getValue(true);
			}

			var trial_data = {
				"rt": response_time,
				"preamble": trial.preamble,
				"superq": trial.superq,
				"responses": JSON.stringify(question_data)
			};
			// next trial
			display_element.innerHTML = ''; // clear the screen
			jsPsych.finishTrial(trial_data);
		});

		var startTime = (new Date()).getTime();
	};

	return plugin;
})();