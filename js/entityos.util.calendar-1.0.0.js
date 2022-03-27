//Uses fullcalendar
// https://fullcalendar.io


entityos._util.factory.calendar = function (param)
{
	app.add(
	{
		name: 'util-view-calendar',
		code: function (param)
		{
			var height = entityos._util.param.get(param, 'height', {"default": '370px'}).value;
			var calendarEl = document.getElementById('calendar');
			var calendar = new FullCalendar.Calendar(calendarEl, {})
		}
	})
}