## railway-SQLFORM

Simple - But usefull - Sql Form generator module for express-on-railway NodeJS MVC framework.

This Modules is for Jugglingdb and written for express-on-railway framework. 
	https://github.com/1602/jugglingdb
	https://github.com/1602/express-on-railway

## Features
1) extend properties, add "Lable", "Comment", "Class", "Style"
2) use custom widget for field, by binding the property to a custom function
3) generate form on-the fly
4) using form generator as an Insert or Update form
5) set custom value for submit button

## TO-DO
1) add tabless feature
2) add xhr (ajax) request 

## Usage

Step 1. Add Plig-in: to "npmfile.js" in express-on-railway

```javascript
    require('railway-pagination');
```

Step 2. Extend your Schema;

```javascript
	var Person = define('Person', function () {
	    property('email', {index: true});
	    property('name', {limit: 50});
	    property('createdAt', Date);
	    property('gender');
	});


	Person.extProperty({
		email: {label: 'Enter your Email:', comment: 'e.g: john.smith@gmail.com'},
		name: {label: 'Enter your Full Name:', comment: 'e.g: John Smith'},
		gender: {label: 'Gender:', comment: '"Male" or "Femail"', syle:'width: 40px'}
	});
```

Step 3. Generate Form Schema - you can generate the form schema in your Controller and then pass to your view

```javascript
	action('index', function () {
		form = Person.FormSchema({});
	    render({
	        title: 'welcome',
			update_form: form
	    });
	});
```

Step 4. Get your form html elements with your form schema

```javascript
	!= SQLFORM(update_form, {submit_button: {class: 'btn btn-primary', value: 'اSubmit Form'}, hidden: {myhidden: {id: 'hiddenbox1', value:'somevalue'}, myhidden2: {id:'', value:'2'}}}, request)
```

## Advance Usage

You can use your custom element instead of defult element which is Input Text Box.
To defined your custom element , you should defined a function for "widget" property in extProperty function.

```javascript
	Person.extProperty({
		email: {label: 'Enter your Email:', comment: 'e.g: john.smith@gmail.com'},
		name: {label: 'Enter your Full Name:', comment: 'e.g: John Smith'},
		gender: {label: 'Gender:', comment: '"Male" or "Femail"', syle:'width: 40px', widget: myWidget}
	});

	function myWidget(field, value) {
		var output = '<input type="radio" value="male" name="' + field + '" /> Male <br />';
		output += '<input type="radio" value="female" name="' + field + '" /> Female';

		return output;
	}
```

You can specify which property should shown on your form also.
in your controller for example you can use fields option, and define your properties as an Array().

```javascript
	action('index', function () {
		form = Person.FormSchema({name: 'frmPerson', action: '/new_person'}, {}, ['email', 'name']);
	    render({
	        title: 'welcome',
			update_form: form
	    });
	});
```




## License

MIT