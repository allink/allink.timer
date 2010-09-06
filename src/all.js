$(document).ready(function() {
    
    // reminder all 30min
    // $(this).everyTime('1800s',function(i) {
    //     window.fluid.showGrowlNotification({
    //        'title': COMPANY.text(),
    //        'description': "don't forget to track your time",
    //     });
    // });
    
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
    var HOURS = $('#hours');
    var DESC = $('#desc');
    var LOADER = $('#loader');
    var USER = $('#user');
    var HISTORY_LIST = $('#history_list');
    var ADD_BUTTON = $('#addButton');
    
    function startUp() {
        BASE_URL.attr('value', $.cookie(COOKIE_BASE_URL));
        API_TOKEN.attr('value', $.cookie(COOKIE_API_TOKEN));
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
    
    ADD_BUTTON.click(function() {
        LOADER.show();
        
        var userId = parseInt(USER_ID.text());
        var companyId = parseInt(COMPANIES.attr('value'));
        var projectId = parseInt(PROJECTS.attr('value'));
        var projectName = $('option:selected',PROJECTS).text();
        var hours = HOURS.attr('value');
        var desc = DESC.attr('value');
        var today = new Date();
        var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        
        if (companyId > 0 && projectId > 0 && hours > 0) {
            $.ajax({
                type: 'POST',
                url: baseUrl + '/projects/' + projectId + '/time_entries.xml',
                contentType: 'application/xml',
                data: '<time-entry><person-id>' + userId + '</person-id><date>' + date + '</date><hours>' + hours + '</hours><description>' + desc + '</description></time-entry>',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('Authorization', 'Basic ' + $.base64.encode(apiToken + ':X'));
                    xhr.setRequestHeader('Accept','application/xml');
                },
                complete: function(request, status) {
                    if (parseInt(request.status) == 201) {
                        window.fluid.showGrowlNotification({
                           'title': COMPANY.text(),
                           'description': "tracked " + hours + " hours on " + projectName,
                        });
                        DESC.attr('value','');
                        HOURS.attr('value','');
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
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + $.base64.encode(apiToken + ':X'));
                xhr.setRequestHeader('Accept','application/xml');
            },
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
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + $.base64.encode(apiToken + ':X'));
                xhr.setRequestHeader('Accept','application/xml');
            },
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
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + $.base64.encode(apiToken + ':X'));
                xhr.setRequestHeader('Accept','application/xml');
            },
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
        
        //var projects = new Array();
        
        LOADER.show();
        PROJECTS.hide();
        PROJECTS.empty();
        PROJECTS.append('<option value="0">please select...</option>');
        $.ajax({
            type: 'GET',
            url: baseUrl + '/projects.xml',
            contentType: 'application/xml',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + $.base64.encode(apiToken + ':X'));
                xhr.setRequestHeader('Accept','application/xml');
            },
            success: function(msg) {
                var filtered = $(msg).find('project').filter(function(index) {
                   return parseInt($(this).find('company').find('id').text()) == parseInt(companyId);
                });
                var sorted = $(filtered).sort(function(a, b) {
                   var at = $(a).find('name:first').text().toLowerCase();
                   var bt = $(b).find('name:first').text().toLowerCase();
                   return (at < bt) ? -1 : 1;
                });
                $(sorted).each(function() {
                    var id = $(this).find('id:first').text();
                    var name = $(this).find('name:first').text();
                    //projects[id] = name;
                    $('<option value="' + id + '"></option>').html(name).appendTo(PROJECTS);
                });
                //$.cookie(COOKIE_PROJECTS, projects, COOKIE_OPTIONS);
                PROJECTS.show();
                LOADER.hide();
            }
        }); 
        
    }
    
    function refreshHistory(baseUrl, apiToken) {
        LOADER.show();
        
        var userId = parseInt(USER_ID.text());
        var today = new Date();
        var year = today.getFullYear();
        var month = (today.getMonth() + 1);
        var day = today.getDate();
        var date = year + (month < 10 ? '0' : '') + month + (day < 10 ? '0' : '') + day;
        
        HISTORY_LIST.empty();
        $.ajax({
            type: 'GET',
            url: baseUrl + '/time_entries/report.xml',
            contentType: 'application/xml',
            data: 'from=' + date + '&to=' + date + '&subject_id=' + userId,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + $.base64.encode(apiToken + ':X'));
                xhr.setRequestHeader('Accept','application/xml');
            },
            success: function(msg) {
                var total = 0.0;
                $(msg).find('time-entry').each(function() {
                    var hours = $(this).find('hours').text();
                    var projectId = $(this).find('project-id').text();
                    var projectName = getProjectName(baseUrl, apiToken, projectId);
                    var desc = $(this).find('description').text();
                    $('<li></li>').html(projectName + ' - ' + hours + 'h - ' + desc).appendTo(HISTORY_LIST);
                    total = total + parseFloat(hours);
                });
                $('<li></li>').html('<strong>Total ' + total + 'h</strong>').appendTo(HISTORY_LIST);
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
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', 'Basic ' + $.base64.encode(apiToken + ':X'));
                xhr.setRequestHeader('Accept','application/xml');
            },
            success: function(msg) {
                projectName = $(msg).find('name:first').text() + " (" + $(msg).find('name:last').text() + ")";
                LOADER.hide();
            }
        });
        
        return projectName;
    }
    
    startUp();

});