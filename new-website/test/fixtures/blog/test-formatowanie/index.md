---
title: "Wpis testowy: lista, link, cytat, kod"
date: 2020-01-01
author: Jan Testowy
category: projekty
tags:
  - test
cover: ./cover.jpg
githubLink: https://github.com/knmlprz/
---

Wpis testowy (test/fixtures/blog). Zawiera **pogrubienie**, *kursywę*, `kod w linii`,
[zwykły link](https://knml.edu.pl/) i bardzo długi link bez spacji:
https://github.com/knmlprz/knml.edu.pl/blob/main/new-website/src/content/blog/bardzo-dlugi-adres-wpisu-ktory-nie-ma-spacji/index.md

## Lista punktowana

- pierwszy punkt
- drugi punkt z [linkiem w środku](https://knml.edu.pl/blog/) zdania
  - punkt zagnieżdżony
- trzeci punkt, dłuższy, żeby zawinął się na telefonie i było widać wcięcie drugiej linijki tekstu

### Lista numerowana

1. pierwszy krok
2. drugi krok
3. trzeci krok

> Cytat: „Najmniej kodu, który działa”. Dłuższy cytat zawija się na kilka linijek na wąskim
> ekranie, a pasek z lewej strony zostaje przy tekście.

```python
# Blok kodu z bardzo długą linijką: ma się przewijać w bloku, a nie rozsadzać strony.
model = torch.nn.Sequential(torch.nn.Linear(784, 256), torch.nn.ReLU(), torch.nn.Linear(256, 10), torch.nn.Softmax(dim=1))
print(model)
```

| Kolumna | Druga kolumna | Trzecia kolumna z długim nagłówkiem |
|---|---|---|
| 1 | dane | jeszcze dłuższe dane w trzeciej kolumnie tabeli |
