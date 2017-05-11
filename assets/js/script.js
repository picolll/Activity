$(function () {

    /**
     * Get parameters form URL
     *
     * @param name
     * @returns {*}
     */
    $.urlParam = function (name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results == null) return false;
        return results[1] || false;
    };

    var minAge, maxAge, threshold;

    minAge = $.urlParam('minAge') ? $.urlParam('minAge') : 20;
    maxAge = $.urlParam('maxAge') ? $.urlParam('maxAge') : 40;
    threshold = $.urlParam('threshold') ? $.urlParam('threshold') : 150;

    /* Validate age from input */
    if (parseInt(maxAge) < 1) maxAge = 1;
    if (parseInt(minAge) < 1) minAge = 1;
    if (parseInt(minAge) > 150) minAge = 150;
    if (parseInt(maxAge) > 150) maxAge = 150;
    if (parseInt(minAge) > parseInt(maxAge)) minAge = maxAge;

    $('input[name=minAge]').val(minAge);
    $('input[name=maxAge]').val(maxAge);
    $('input[name=threshold]').val(threshold);

    var filters = $('input[type=number]');

    /**
     * Renders table after ENTER or Apply button being pressed
     */
    $('.filters button').click(function (e) {

        minAge    = $.urlParam('minAge');
        maxAge    = $.urlParam('maxAge');
        threshold = $.urlParam('threshold');
    });

    render(minAge, maxAge, threshold);


    /**
     * Gets data and renders the table for given filters
     *
     * @param minAge
     * @param maxAge
     * @param threshold
     */
    function render(minAge, maxAge, threshold) {

        var $patientsTable = $("#patientsTable");

        $patientsTable.find('tbody').empty();
        $patientsTable.removeClass();

        var patients, activities, patientsData = [];
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

    /**
     * Calculates given patient activity amount
     *
     * @param activities
     * @param patientData
     * @returns {number}
     */
    function getActivityLevel(activities, patientData) {

        var sum = 0;
        $.each(patientData, function (index, value) {
            sum += parseInt(value.minutes) * parseInt(activities[value.activity]);

        });
        return sum;
    }

    /**
     * Simplifies activities definition
     *
     * @param activities
     * @returns {Array}
     */
    function simplifyActivities(activities) {
        var simplifiedActivities = [];
        $.each(activities, function (index, value) {
            simplifiedActivities[value.activity] = getActivityLevelFactor(value.intensity);
        });
        return simplifiedActivities;
    }


    /**
     * Get multiply factor for intensity
     *
     * @param intensity
     * @returns {number}
     */
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
     * Check is age is within given range
     *
     * @param age
     * @param min
     * @param max
     * @returns {boolean}
     */
    function isAgeInRange(age, min, max) {
        return (age >= min) ? (age <= max) : false;
    }

    /**
     * Calculates age from Birth Date
     *
     * @param dob
     * @returns {number}
     */
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

    /**
     * Draws single patient table row
     *
     * @param patient
     * @param threshold
     */
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
