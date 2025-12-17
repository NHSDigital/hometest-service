def getRandomValue(array) {
    def randomIndex = new Random().nextInt(array.size())
    return array[randomIndex]
}

def getRandomValueFromRange(min, max) {
    return new Random().nextInt((max - min) + 1) + min
}

def getRandomFloatValue(float min, float max) {
    Random random = new Random()
    float randomFloat = min + (random.nextFloat() * (max - min))
    return Math.round(randomFloat * 10) / 10.0
}

def excerciseHours = ['None', 'LessThanOne', 'BetweenOneAndThree', 'ThreeHoursOrMore']
def randomData = [
    'sex': ['Female', 'Male'],
    'ethnicBackground': ['AsianOrAsianBritish', 'BlackAfricanCaribbeanOrBlackBritish', 'MixedOrMultipleGroups', 'White', 'Other'],
    'smoking': ['Never', 'Quitted', 'UpToNinePerDay', 'TenToNineteenPerDay', 'TwentyOrMorePerDay'],
    'excerciseHours': excerciseHours,
    'walkHours': excerciseHours,
    'cycleHours': excerciseHours,
    'houseworkHours': excerciseHours,
    'gardeningHours': excerciseHours,
    'height': [getRandomValueFromRange(170, 180).toString()],
    'weight': [getRandomValueFromRange(65, 73).toString()],
    'waist': [getRandomValueFromRange(75, 85).toString()],
    'bloodPressureSystolic': [getRandomValueFromRange(115, 130).toString()],
    'bloodPressureDiastolic': [getRandomValueFromRange(75, 85).toString()],
    'cholesterolCHO': ["${getRandomFloatValue(2.0, 8)}"],
    'cholesterolHDL': ["${getRandomFloatValue(1.0, 4)}"],
    'cholesterolCHDD': ["${getRandomFloatValue(1.0, 4)}"],
]

for ( entry in randomData ) {
    vars.put(entry.key, getRandomValue(entry.value))
}
