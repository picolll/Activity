$(function () {

    $.urlParam = function (name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        return results[1] || 0;
    }

    var filters = $('input[type=number]');

    minAge    = $.urlParam('minAge')? $.urlParam('minAge') :20;
    maxAge    = $.urlParam('maxAge')? $.urlParam('maxAge') :40;
    threshold = $.urlParam('threshold')? $.urlParam('threshold') :150;
    $('input[name=minAge]').val(minAge);
    $('input[name=maxAge]').val(maxAge);
    $('input[name=threshold]').val(threshold);


    $('.filters button').click(function (e) {

        minAge    = $.urlParam('minAge');
        maxAge    = $.urlParam('maxAge');
        threshold = $.urlParam('threshold');
    });

    render(minAge, maxAge, threshold);

    function render(minAge, maxAge, threshold) {

        $("#patientsTable").find('tbody').empty();
        $("#patientsTable").removeClass();

        var patients;
        var activities;
        var patientsData = [];
        $.when(
            $.getJSON("mock-api-data/patients.json", function (data) {
                patients = data;
            }),
            $.getJSON("mock-api-data/definitions/activities.json", function (data) {
                activities = simplifyActivities(data);
            })
        ).then(
            function () {
                var length = patients.length;
                $.each(patients, function (index, value) {
                    const patientDataURL = "mock-api-data/patients/" + value.id + "/summary.json";
                    $.getJSON(patientDataURL, function (data) {
                        patientsData[value.id] = data;
                        const age              = getAge(value.birthDate);
                        value.ageInRange       = isAgeInRange(age, minAge, maxAge);
                        value.activityLevel    = getActivityLevel(activities, patientsData[value.id]);

                        drawPatient(value, threshold);

                    }).done(function () {
                        if (index == length - 1) {
                            setTimeout(function () {
                                $("#patientsTable").addClass('sortable');
                                $.getScript("assets/js/sorttable.js", function () {
                                    sorttable.init();
                                })
                            }, 50);


                        }
                    })
                })
            }
        );
    }

    function getActivityLevel(activities, patientData) {

        var sum = 0;
        $.each(patientData, function (index, value) {
            sum += parseInt(value.minutes) * parseInt(activities[value.activity]);

        });
        return sum;

    }

    function simplifyActivities(activities) {
        var simplifiedActivities = [];
        $.each(activities, function (index, value) {
            simplifiedActivities[value.activity] = getActivityLevelFactor(value.intensity);
        });
        return simplifiedActivities;
    }


    function getActivityLevelFactor(intensity) {
        switch (intensity) {
            case 'none':
                return 0;
            case 'low':
                return 0;
            case 'moderate':
                return 1;
            case 'vigorous':
                return 2;
            default:
                return 0;
        }
    }

    /**
     *
     * @param age
     * @param min
     * @param max
     * @returns {boolean}
     */
    function isAgeInRange(age, min, max) {
        return (age >= min) ? (age <= max) : false;
    }

    function getAge(dob) {
        var now       = new Date();
        var birthDate = new Date(dob);
        var age       = now.getFullYear() - birthDate.getFullYear();
        var month     = now.getMonth() - birthDate.getMonth();
        if (month < 0 || (month === 0 && now.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }

    function drawPatient(patient, threshold) {
        const color = patient.ageInRange ?
            (patient.activityLevel >= threshold ?
                "background: lightgreen"
                : "background: red")
            : '';
        var row     = $("<tr style='" + color + "' />");
        $("#patientsTable").append(row);
        row.append($("<td>" + patient.id + "</td>"));
        row.append($("<td>" + patient.name + "</td>"));
        row.append($("<td>" + patient.gender + "</td>"));
        row.append($("<td>" + patient.birthDate + "</td>"));
        row.append($("<td>" + patient.heightCm + "</td>"));
        row.append($("<td>" + patient.weightKg + "</td>"));
        row.append($("<td>" + patient.bmi + "</td>"));
        row.append($("<td>" + patient.activityLevel + "</td>"));
    }

});
