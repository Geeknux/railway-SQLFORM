/*
* Simple Form generator for jugglingdb
* (c) 2012 Amir M. Mahmoudi <a-mahmoudi.com>
* MIT license
*
* This Modules is based on Jugglingdb and written for express-on-railway
* https://github.com/1602/jugglingdb
* https://github.com/1602/express-on-railway
*/

 var util = require('util');

exports.init = function () {
	// add orm method
	railway.orm.AbstractClass.extProperty = extendProperty;
	railway.orm.AbstractClass.FormSchema = generate_form;

    // add view helper
    railway.helpers.HelperSet.prototype.SQLFORM = getForm;
};

/**
 * Extend Properties in jugglingdb
 *
 * @param obj - this is an object that contain some new feature for properties
 */
function extendProperty(obj) {
	var model = this.schema.definitions[this.modelName];
	
	if(typeof obj === 'object') {
		Object.keys(obj).forEach(function (o) {
			var property = model.properties[o];
			Object.keys(obj[o]).forEach(function (propertyKey) {
				if(propertyKey === 'widget' && typeof obj[o][propertyKey] !== 'function') {
					return true;	
				}
				property[propertyKey] = obj[o][propertyKey];
			});
		});
	}

	return this;
}


/**
 * Generate a Insert/Edit Form based on schema structure
 *
 * @param info - Form information {name, action, method: "Post", enctype: "multipart/form-data", SubmitButtonValue}
 * @param data - if generator used for edit, data is a recored of schema
 * @param fields - specifying which fields of schema should be in form
 */
function generate_form(info, data, fields) {
	try {	
		var err;
		var model = this.schema.definitions[this.modelName];
		var formName = formId = info['name'] ? info['name'] : this.modelName;
		var formType = info['enctype'] ? info['enctype'] : 'multipart/form-data';
		var formAction = info['action'] ? info['action'] : '';
		var formMethod = info['method'] ? info['method'] : 'POST';
		var formFields = util.isArray(fields) ? fields : [];
		var formData = (typeof data === 'object') ? data : '';

		//We create an object with our forms element, then return it to user
		var output = 
		{ 
			form: 
			{
				name: formName,
				enctype: formType,
				action: formAction,
				method: formMethod
			}
		}

		//filter properties and get final properties that we want to be in form
		properties =  filter_fields(model.properties, formFields, formData);
		
		output['form']['properties'] = properties;

		return output;
	} catch (err) {
		throw new Error(err);
	}

}

/**
 * Generate a form based on tables 
 * TODO: add tabless style
 *
 * @param formSchema - Object - this is form object
 * @param extData - Object - This object has recieve some extera data form our form as describe below
 * @param request - Object - this is global request from express should be passed to this module
 *
 * extData = {submit_button:'value', hidden: {fieldName:{id:'',value:''}, fieldName2: {id:'', value:''}} }
 */
function getForm(formSchema, extData, request) {
	var output = '';

	if(typeof formSchema === 'object' && typeof formSchema['form'] === 'object') {
		var output = util.format('<form id="%s" name="%s" enctype="%s" action="%s", method="%s">', formSchema['form']['name'], formSchema['form']['name'], formSchema['form']['enctype'], formSchema['form']['action'], formSchema['form']['method']);

		// Add crf input if form method is POST
		if((formSchema['form']['method']).toLowerCase() === 'post') {
			output += '<input type="hidden" name="_method" value="PUT" />';
			output += util.format('<input type="hidden" name="%s" value="%s" />', request.csrfParam, request.csrfToken);
		}

		//Check for extra hidden fields
		if(typeof extData['hidden'] === 'object') {
			var hiddens = extData['hidden'];
			Object.keys(hiddens).forEach(function (hideFields) {
				output += util.format('<input type="hidden" name="%s" id="%s" value="%s" />', hideFields, hiddens[hideFields]['id'], hiddens[hideFields]['value']);
			});
		}

		var properties = formSchema['form']['properties'];
		if(typeof properties === 'object') {
			output += '<table><tbody>'
			Object.keys(properties).forEach(function (prop) {
				output += util.format('<tr id="%s">', formSchema['form']['name'] + '_' + prop + '__row');

				//Title label
				output += util.format('<td class="rqf_caption"><lable id="%s">%s</lable></td>', formSchema['form']['name'] + '_' + prop + '__caption', (properties[prop]['label']) ? properties[prop]['label'] : prop);

				// Input control for our fields, the defualt field is Input text box
				output += '<td class="rqf_field">';
				
				if(typeof properties[prop]['widget'] === 'function') {
					output += properties[prop]['widget'](prop, properties[prop]['value']);
				} else {
					if(properties[prop].type.name === 'Text') {
						output += util.format('<textarea id="%s" name="%s" class="text%s" %s>%s</textarea>', prop, prop, (properties[prop]['class']) ? ' ' + properties[prop]['class'] : '', (properties[prop]['style']) ? ' style="' + properties[prop]['style'] + '"' : '', properties[prop]['value']);
					} else if (properties[prop].type.name === 'Boolean') {
						output += util.format('<input type="checkbox" id="%s" name="%s" class="text%s" %s%s />', prop, prop, (properties[prop]['class']) ? ' ' + properties[prop]['class'] : '', (properties[prop]['style']) ? ' style="' + properties[prop]['style'] + '"' : '', (properties[prop]['value']) ? ' CHECKED' : '');
					} else {
						output += util.format('<input type="text" id="%s" name="%s" value="%s" class="text%s" %s />', prop, prop, properties[prop]['value'], (properties[prop]['class']) ? ' ' + properties[prop]['class'] : '', (properties[prop]['style']) ? ' style="' + properties[prop]['style'] + '"' : '');
					}
				}

				output += '</td>';
				//Comment Label
				output += util.format('<td class="rqf_comment"><lable id="%s">%s</lable></td>', formSchema['form']['name'] + '_' + prop + '__comment', (properties[prop]['comment']) ? properties[prop]['comment'] : '');

				output += '</tr>';
			});

			//Add submit button
			if(extData['submit_button'] !== 'none') {
				extData['submit_button'] = (typeof extData['submit_button'] === 'object') ? extData['submit_button'] : {};
				output += util.format('<tr id="rqf_submits"><td colspan="3"><input type="submit" name="rqf_submitform" value="%s"%s%s /></td></tr>', (typeof extData['submit_button']['value'] !== 'undefined') ? extData['submit_button']['value'] : 'Submit', (typeof extData['submit_button']['class'] !== 'undefined') ? ' class="' + extData['submit_button']['class'] + '"' : '', (typeof extData['submit_button']['style'] !== 'undefined') ? ' style="' + extData['submit_button']['style'] + '"' : '');
			}

			output += '</tbody></table>'
		}

		output += '</form>';
	}

	return output;
}

/**
 * Filter properties from the whole properties, maybe we want some of properties for our form
 *
 * @param properties - Object - the whole properties we defined for our schema
 * @param fields - Array - array of specific property to shown in form
 * @param data - Object - object of data using for update form or default values
 *
 */
function filter_fields(properties, fields, data) {
	var true_prop = {};
	Object.keys(properties).forEach(function (prop) {
		if(fields.length === 0 || fields.indexOf(prop) >= 0) {
			if (typeof data === 'object' && data[prop]) {
				properties[prop]['value'] = data[prop];
			} else if(typeof properties[prop]['default'] != 'undefined') {
				properties[prop]['value'] = properties[prop]['default'];
			} else {
				properties[prop]['value'] = '';
			}
			true_prop[prop] = properties[prop];
		}
	});

	return true_prop;
}