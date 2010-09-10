$(document).ready(function() {
    
    var COOKIE_BASE_URL = 'base_url';
    var COOKIE_API_TOKEN = 'api_token';
    var COOKIE_PROJECTS = 'projects_cache';
    var COOKIE_OPTIONS = { path: '/', expires: 360 };
    
    var BASE_URL = $('#baseUrl');
    var API_TOKEN = $('#apiToken');
    var TIME_LINK = $('#time_link');
    var PROJECTS = $('#projects');
    var SETTINGS = $('#settings');
    var SETTINGS_LINK = $('#settings_link');
    var HISTORY = $('#history');
    var HISTORY_LINK = $('#history_link');
    var TIME = $('#time');
    var COMPANY = $('#company');
    var COMPANIES = $('#companies');
    var USER_ID = $('#userId');
    var DATE = $('#date');
    var HOURS = $('#hours');
    var DESC = $('#desc');
    var LOADER = $('#loader');
    var USER = $('#user');
    var HISTORY_LIST = $('#history_list');
    var ADD_BUTTON = $('#addButton');
    var HISTORY_DATE = $('#historyDate');
    
    function startUp() {
        BASE_URL.attr('value', $.cookie(COOKIE_BASE_URL));
        API_TOKEN.attr('value', $.cookie(COOKIE_API_TOKEN));
        refreshCalendar();
        checkSettings();
        refreshCompanies(baseUrl, apiToken);
    }
    
    function checkSettings() {   
        baseUrl = BASE_URL.attr('value');
        apiToken = API_TOKEN.attr('value');
        
        if (baseUrl != '' && apiToken != '') {
            refreshAccount(baseUrl, apiToken);
        }
    }
    
    BASE_URL.change(function() {
        $.cookie(COOKIE_BASE_URL, BASE_URL.attr('value'), COOKIE_OPTIONS);
        checkSettings();
    });
    
    API_TOKEN.change(function() {
        $.cookie(COOKIE_API_TOKEN, API_TOKEN.attr('value'), COOKIE_OPTIONS);
        checkSettings();
    });

    TIME_LINK.click(function() {
        PROJECTS.hide();
        
        SETTINGS.hide();
        SETTINGS_LINK.removeClass('current');
        HISTORY.hide();
        HISTORY_LINK.removeClass('current');
        
        TIME_LINK.addClass('current');
        DATE.val(new Date().asString());
        TIME.show();
        
        refreshAccount(baseUrl, apiToken);
        refreshCompanies(baseUrl, apiToken);
    });
    
    HISTORY_LINK.click(function() {
        TIME.hide();
        TIME_LINK.removeClass('current');
        SETTINGS.hide();
        SETTINGS_LINK.removeClass('current');
        
        HISTORY_LINK.addClass('current');
        HISTORY.show();
        
        refreshAccount(baseUrl, apiToken);
        refreshHistory(baseUrl, apiToken);
    });
    
    SETTINGS_LINK.click(function() {
        TIME.hide();
        TIME_LINK.removeClass('current');
        HISTORY.hide();
        HISTORY_LINK.removeClass('current');
        
        SETTINGS_LINK.addClass('current');
        SETTINGS.show();
    });
    
    COMPANIES.change(function() {
        var companyId = parseInt($(this).attr('value'));
        if (companyId > 0) {
            refreshProjects(baseUrl, apiToken, companyId);
        }
    });
    
    PROJECTS.change(function() {
        var projectId = parseInt($(this).attr('value'));
        if (projectId > 0) {
            enableTimeInputFields();
        }
    });
    
    HISTORY_DATE.change(function() {
        refreshHistory(baseUrl, apiToken);
    });
    
    ADD_BUTTON.click(function() {
        LOADER.show();
        
        var userId = parseInt(USER_ID.text());
        var companyId = parseInt(COMPANIES.attr('value'));
        var projectId = parseInt(PROJECTS.attr('value'));
        var projectName = $('option:selected',PROJECTS).text();
        var hours = HOURS.attr('value');
        var desc = DESC.attr('value');
        var date = DATE.datePicker().val();
        
        if (companyId > 0 && projectId > 0 && hours > 0) {
            $.ajax({
                type: 'POST',
                url: baseUrl + '/projects/' + projectId + '/time_entries.xml',
                contentType: 'application/xml',
                data: '<time-entry><person-id>' + userId + '</person-id><date>' + date + '</date><hours>' + hours + '</hours><description>' + desc + '</description></time-entry>',
                beforeSend: function(xhr) { setDefaultRequestHeader(xhr); },
                complete: function(request, status) {
                    if (parseInt(request.status) == 201) {
                        if (window.fluid) {
                            window.fluid.showGrowlNotification({
                               'title': COMPANY.text(),
                               'description': "tracked " + hours + " hours on " + projectName,
                            }); 
                        }
                        DESC.attr('value','');
                        HOURS.attr('value','');
                        DATE.val(new Date().asString());
                    };
                    LOADER.hide();
                },
            });
        }
    });
    
    $.fn.sort=[].sort;
    
    function refreshAccount(baseUrl, apiToken) {
        
        LOADER.show();
        $.ajax({
            type: 'GET',
            url: baseUrl + '/account.xml',
            contentType: 'application/xml',
            beforeSend: function(xhr) { setDefaultRequestHeader(xhr); },
            success: function(msg) {
                $(msg).find('account:first').each(function() {
                    COMPANY.text($(this).find('name:first').text());
                });
            }
        });
        
        $.ajax({
            type: 'GET',
            url: baseUrl + '/me.xml',
            contentType: 'application/xml',
            beforeSend: function(xhr) { setDefaultRequestHeader(xhr); },
            success: function(msg) {
                $(msg).find('person:first').each(function() {
                    USER.text($(this).find('first-name').text() + ' ' + $(this).find('last-name').text());
                    USER_ID.text($(this).find('id').text());
                    LOADER.hide();
                });
            }
        });
        
    }
    
    function refreshCompanies(baseUrl, apiToken) {
        
        LOADER.show();
        COMPANIES.hide();
        COMPANIES.empty();
        COMPANIES.append('<option value="0">please select...</option>');
        $.ajax({
            type: 'GET',
            url: baseUrl + '/companies.xml',
            contentType: 'application/xml',
            beforeSend: function(xhr) { setDefaultRequestHeader(xhr); },
            success: function(msg) {
                var sorted = $(msg).find('company').sort(function(a, b) {
                   var at = $(a).find('name:first').text().toLowerCase();
                   var bt = $(b).find('name:first').text().toLowerCase();
                   return (at < bt) ? -1 : 1;
                });
                $(sorted).each(function() {
                    var id = $(this).find('id').text();
                    var name = $(this).find('name:first').text();
                    $('<option value="' + id + '"></option>').html(name).appendTo(COMPANIES);
                });
                COMPANIES.show();
                LOADER.hide();
            }
        });
        
    }
    
    function refreshProjects(baseUrl, apiToken, companyId) {
        
        disableTimeInputFields();
        
        LOADER.show();
        PROJECTS.hide();
        PROJECTS.empty();
        PROJECTS.append('<option value="0">please select...</option>');
        $.ajax({
            type: 'GET',
            url: baseUrl + '/projects.xml',
            contentType: 'application/xml',
            beforeSend: function(xhr) { setDefaultRequestHeader(xhr); },
            success: function(msg) {
                var filtered = $(msg).find('project').filter(function(index) {
                   return parseInt($(this).find('company').find('id').text()) == parseInt(companyId) && $(this).find('status').text() == 'active';
                });
                var sorted = $(filtered).sort(function(a, b) {
                   var at = $(a).find('name:first').text().toLowerCase();
                   var bt = $(b).find('name:first').text().toLowerCase();
                   return (at < bt) ? -1 : 1;
                });
                $(sorted).each(function() {
                    var id = $(this).find('id:first').text();
                    var name = $(this).find('name:first').text();
                    $('<option value="' + id + '"></option>').html(name).appendTo(PROJECTS);
                });
                PROJECTS.show();
                LOADER.hide();
            }
        }); 
        
    }
    
    function refreshHistory(baseUrl, apiToken) {
        LOADER.show();
        
        var userId = parseInt(USER_ID.text());
        var date = HISTORY_DATE.datePicker().val();
        
        HISTORY_LIST.empty();
        $.ajax({
            type: 'GET',
            url: baseUrl + '/time_entries/report.xml',
            contentType: 'application/xml',
            data: 'from=' + date + '&to=' + date + '&subject_id=' + userId,
            beforeSend: function(xhr) { setDefaultRequestHeader(xhr); },
            success: function(msg) {
                var total = 0.0;
                $(msg).find('time-entry').each(function() {
                    var hours = $(this).find('hours').text();
                    var projectId = $(this).find('project-id').text();
                    var desc = $(this).find('description').text();
                    $('<li></li>').html(hours + 'h - ' + desc).appendTo(HISTORY_LIST);
                    total = total + parseFloat(hours);
                });
                $('<li></li>').html('<strong>' + total + 'h Total</strong>').appendTo(HISTORY_LIST);
                LOADER.hide();
            }
        });
        
    }
    
    function getProjectName(baseUrl, apiToken, projectId) {
        var projectName = '';
        
        LOADER.show();
        $.ajax({
            type: 'GET',
            url: baseUrl + '/projects/' + projectId + '.xml',
            contentType: 'application/xml',
            async: false,
            beforeSend: function(xhr) { setDefaultRequestHeader(xhr); },
            success: function(msg) {
                projectName = $(msg).find('name:first').text() + " (" + $(msg).find('name:last').text() + ")";
                LOADER.hide();
            }
        });
        
        return projectName;
    }
    
    function disableTimeInputFields() {
        HOURS.attr("disabled", "disabled");
        DESC.attr("disabled", "disabled");
        ADD_BUTTON.attr("disabled", "disabled");
    }
    
    function enableTimeInputFields() {
        HOURS.attr("disabled", "");
        DESC.attr("disabled", "");
        ADD_BUTTON.attr("disabled", "");
    }
    
    function setDefaultRequestHeader(xhr) {
        xhr.setRequestHeader('Authorization', 'Basic ' + $.base64.encode(apiToken + ':X'));
        xhr.setRequestHeader('Accept','application/xml');
    } 
    
    function refreshCalendar() {
        var todayAsString = new Date().asString();
        DATE.datePicker({startDate:'1996-01-01', endDate:todayAsString}).val(todayAsString).trigger('change');
        HISTORY_DATE.datePicker({startDate:'1996-01-01', endDate:todayAsString}).val(todayAsString).trigger('change');
    }
    
    startUp();
    
    // Cron Job all 15 minutes
    $(this).everyTime('900s',function(i) {
        refreshCalendar();
        // time tracking reminder
        // window.fluid.showGrowlNotification({
        //    'title': COMPANY.text(),
        //    'description': "don't forget to track your time",
        // });
    });

});