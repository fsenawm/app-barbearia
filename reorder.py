import re
with open('src/components/Booking.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

main_start = content.find('<main')
main_end = content.find('</main>')

main_content = content[main_start:main_end]

s1_start = main_content.find('{/* Section: Serviço')
s1_end = main_content.find('{/* Section: Cliente', s1_start)

s2_start = s1_end
s2_end = main_content.find('{/* Section: Data e Horário', s2_start)

s3_start = s2_end
s3_end = main_content.find('{/* Section: Configurações', s3_start)

s4_start = s3_end

section_servico = main_content[s1_start:s1_end]
section_cliente = main_content[s2_start:s2_end]
section_data_horario = main_content[s3_start:s3_end]
section_config = main_content[s4_start:]

new_main_content = '<main className=\"flex-1 overflow-y-auto px-4 py-6 space-y-8 pb-40\">\n                ' + section_cliente.strip() + '\n\n                ' + section_data_horario.strip() + '\n\n                ' + section_servico.strip() + '\n\n                ' + section_config.strip() + '\n            '

new_content = content[:main_start] + new_main_content + content[main_end:]

with open('src/components/Booking.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
