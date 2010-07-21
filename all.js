$(document).ready(function() {
    
    // reminder all 30min
    $(this).everyTime('1800s',function(i) {
        window.fluid.showGrowlNotification({
           'title': $('#company').text(),
           'description': "don't forget to track your time",
        });
    });
    
    var COOKIE_BASE_URL = 'base_url';
    var COOKIE_API_TOKEN = 'api_token';
    var COOKIE_PROJECTS = 'projects_cache';
    var COOKIE_OPTIONS = { path: '/', expires: 360 };
    
    function startUp() {
        $('#baseUrl').attr('value', $.cookie(COOKIE_BASE_URL));
        $('#apiToken').attr('value', $.cookie(COOKIE_API_TOKEN));
        checkSettings();
        refreshCompanies(baseUrl, apiToken);
    }
    
    function checkSettings() {   
        baseUrl = $('#baseUrl').attr('value');
        apiToken = $('#apiToken').attr('value');
        
        if (baseUrl != '' && apiToken != '') {
            refreshAccount(baseUrl, apiToken);
        }
    }
    
    $('#baseUrl').change(function() {
        $.cookie(COOKIE_BASE_URL, $('#baseUrl').attr('value'), COOKIE_OPTIONS);
        checkSettings();
    });
    
    $('#apiToken').change(function() {
        $.cookie(COOKIE_API_TOKEN, $('#apiToken').attr('value'), COOKIE_OPTIONS);
        checkSettings();
    });

    $('#time_link').click(function() {
        $('#projects').remove();
        
        $('#settings').hide();
        $('#settings_link').removeClass('current');
        $('#history').hide();
        $('#history_link').removeClass('current');
        
        $('#time_link').addClass('current');
        $('#time').show();
        
        refreshAccount(baseUrl, apiToken);
        refreshCompanies(baseUrl, apiToken);
    });
    
    $('#history_link').click(function() {
        $('#time').hide();
        $('#time_link').removeClass('current');
        $('#settings').hide();
        $('#settings_link').removeClass('current');
        
        $('#history_link').addClass('current');
        $('#history').show();
        
        console.log($.cookie(COOKIE_PROJECTS));
        
        refreshAccount(baseUrl, apiToken);
        refreshHistory(baseUrl, apiToken);
    });
    
    $('#settings_link').click(function() {
        $('#time').hide();
        $('#time_link').removeClass('current');
        $('#history').hide();
        $('#history_link').removeClass('current');
        
        $('#settings_link').addClass('current');
        $('#settings').show();
    });
    
    $('#companies').change(function() {
        var companyId = parseInt($(this).attr('value'));
        if (companyId > 0) {
            $('#projects').show();
            refreshProjects(baseUrl, apiToken, companyId);
        }
    });
    
    $('#addButton').click(function() {
        var userId = parseInt($('#userId').text());
        var companyId = parseInt($('#companies').attr('value'));
        var projectId = parseInt($('#projects').attr('value'));
        var projectName = $('option:selected','#projects').text();
        var hours = $('#hours').attr('value');
        var desc = $('#desc').attr('value');
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
                           'title': $('#company').text(),
                           'description': "tracked " + hours + " hours on " + projectName,
                        });
                        $('#desc').attr('value','');
                        $('#hours').attr('value','');
                    }
                },
            });
        }
    });
    
    $.fn.sort=[].sort;
    
    function refreshAccount(baseUrl, apiToken) {
        
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
                    $('#company').text($(this).find('name').text());
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
                    $('#user').text($(this).find('first-name').text() + ' ' + $(this).find('last-name').text());
                    $('#userId').text($(this).find('id').text());
                });
            }
        });
        
    }
    
    function refreshCompanies(baseUrl, apiToken) {
        
        $('#companies').empty();
        $('#companies').append('<option value="0">please select...</option>');
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
                   var at = $(a).find('name').text();
                   var bt = $(b).find('name').text();
                   return (at < bt) ? -1 : 1;
                });
                $(sorted).each(function() {
                    var id = $(this).find('id').text();
                    var name = $(this).find('name').text();
                    $('<option value="' + id + '"></option>').html(name).appendTo('#companies');
                });
            }
        });
        
    }
    
    function refreshProjects(baseUrl, apiToken, companyId) {
        
        var projects = new Array();
        
        $('#projects').empty();
        $('#projects').append('<option value="0">please select...</option>');
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
                   var at = $(a).find('name:first').text();
                   var bt = $(b).find('name:first').text();
                   return (at < bt) ? -1 : 1;
                });
                $(sorted).each(function() {
                    var id = $(this).find('id:first').text();
                    var name = $(this).find('name:first').text();
                    projects[id] = name;
                    $('<option value="' + id + '"></option>').html(name).appendTo('#projects');
                });
                $.cookie(COOKIE_PROJECTS, projects, COOKIE_OPTIONS);
            }
        }); 
        
    }
    
    function refreshHistory(baseUrl, apiToken) {
        var userId = parseInt($('#userId').text());
        var today = new Date();
        var year = today.getFullYear();
        var month = (today.getMonth() + 1);
        var day = today.getDate() - 1;
        var date = year + (month < 10 ? '0' : '') + month + (day < 10 ? '0' : '') + day;
        
        $('#history_list').empty();
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
                $(msg).find('time-entry').each(function() {
                    var hours = $(this).find('hours').text();
                    var projectId = $(this).find('project-id').text();
                    var projectName = getProjectName(baseUrl, apiToken, projectId);
                    var desc = $(this).find('description').text();
                    $('<li></li>').html(projectName + ' - ' + hours + 'h - ' + desc).appendTo('#history_list');
                });
            }
        });
        
    }
    
    function getProjectName(baseUrl, apiToken, projectId) {
        var projectName = '';
        
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
                projectName = $(msg).find('name').text();
            }
        });
        
        return projectName;
    }
    
    startUp();

});