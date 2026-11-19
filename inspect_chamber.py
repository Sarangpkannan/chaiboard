with open('templates/chamber.html', 'r', encoding='utf-8') as f:
    text = f.read()

body_start = text.find('<body')
main_start = text.find('<main')
print('=== Between <body> and <main> ===')
print(text[body_start:main_start])

