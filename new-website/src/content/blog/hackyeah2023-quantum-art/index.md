---
title: "HackYeah 2023: Quantum Art"
date: 2023-10-06T08:00:00+02:00
author: Piotr Krawiec
category: projekty
tags:
  - python
  - art
  - quantum computing
  - hackathon
  - hackyeah
cover: ./attachment/cover.png
githubLink: https://github.com/knmlprz/
draft: false
---

Na HackYeah 2023 czekało na nas sporo ciekawych wyzwań. Zdecydowaliśmy się podjąć temat niezwiązany z analizą danych - „Quantum Art" [^1]. W tym artykule postaramy się opowiedzieć, czego udało nam się dokonać podczas Hackathonu i pochwalić się pięknymi obrazkami i gifami 😀

## Czym jest Quantum art?

Quantum Art to rodzaj sztuki, w której tworzeniu biorą udział komputery kwantowe. Wykorzystuje się przy tym zjawiska takie jak superpozycja kubitów, splątanie kwantowe, czy fakt, iż komputery kwantowe nie są idealne — ich wyniki obarczone są pewnym błędem.

![Fraktal: czerwono-żółte spirale zbioru Julii na białym tle](attachment/04501973682c9b1fcb5e3b537a82d744.png)
*Julia set stworzony z liczby wygenerowanej przez komputer kwantowy.*

Znaleźliśmy kilka sposobów na generowanie kwantowej sztuki, większość z nich wykorzystywała komputer kwantowy jako generator liczb losowych. 

Komputer kwantowy może generować liczby losowe poprzez dokonywanie pomiaru prawdopodobieństwa stanów w obwodzie kwantowym. Prawdopodobieństwa te obarczone są pewnym błędem pomiaru — stąd możemy traktować je jak liczby losowe. IBM wykorzystał tę metodę do wygenerowania fraktali [^3]. Postanowiliśmy wykorzystać tę samą metodę do:
1. Wygenerowania fraktali w różnych paletach kolorów.
2. Animacji kolejnych iteracji tworzenia fraktala (patrz obrazek poniżej).

![Animacja kolejnych iteracji tworzenia fraktala w odcieniach czerwieni i żółci](attachment/18f5e7a874f7ada2b5d820f1acdec1c8.gif)

Fraktale, które tworzyliśmy to zbiory Julii [^4]. Do ich generowania wykorzystaliśmy funkcję:

```python
def julia_set2CN1(c0=0, c1=0, height=heightsize, width=widthsize, x=0, y=0, zoom=1, max_iterations=100, save=False, cmap='hot'):

	# To make navigation easier we calculate these values
	x_width = 1.5
	y_height = 1.5*height/width
	x_from = x - x_width/zoom
	x_to = x + x_width/zoom
	y_from = y - y_height/zoom
	y_to = y + y_height/zoom
	
	# Here the actual algorithm starts and the z paramter is defined for the Julia set function
	x = np.linspace(x_from, x_to, width).reshape((1, width))
	y = np.linspace(y_from, y_to, height).reshape((height, 1))
	z = x + 1j * y
	
	# Initialize the c's to the complex amplitudes obtained from the quantum circuit
	c0 = np.full(z.shape, c0)
	c1 = np.full(z.shape, c1)
	
	# To keep track in which iteration the point diverged
	div_time = np.zeros(z.shape, dtype=int)
	
	# To keep track on which points did not converge so far
	m = np.full(c0.shape, True, dtype=bool)
	for i in range(max_iterations):
		z[m] = (z[m]**2 + c0[m]) / (z[m]**2 + c1[m]) # julia set mating 1
		m[np.abs(z) > escapeno] = False
		div_time[m] = i
		if save:
			# Save as png
			plt.imshow(div_time, cmap=cmap)
			plt.axis('off')
			plt.savefig(f'julia_set2CN1_{i}.png', bbox_inches='tight', pad_inches=0)
	
	return div_time
```
*Źródło: [Cantorsparadise](https://www.cantorsparadise.com/the-julia-set-e03c29bed3d0)*

## Przykładowe fraktale

Oto przykładowe fraktale, które wygenerowaliśmy:

![Fraktal: czarne, niebieskie, fioletowe i pomarańczowe koła na białym tle](attachment/b5ce4ea4061e31a00947a9bd870b35c4.png)

![Fraktal: fioletowe i niebieskie kształty na żółtym tle](attachment/f1a4ef65a6152a3cbc3a004a8cc9511c.png)

![Fraktal: łańcuchy kolorowych kół biegnące ukośnie przez białe tło](attachment/2902f83f4ef3bc8b517a1f8774216c38.png)

![Fraktal: gęsty wzór niebieskich i czarnych kół na białym tle](attachment/a1409c1df2b5b32eb3f44decefc32877.png)

![Fraktal: zielone kształty na jasnożółtym tle](attachment/8629e1fd41bbe69d73f8ed69bc3214de.png)

A oto ich wersje animowane:

![Animacja fraktala z zielonymi kształtami na jasnożółtym tle](attachment/4797d2464127495aae2ae803e64ce974.gif)

![Animacja fraktala z fioletowymi kształtami na żółtym tle](attachment/eff36e9f43dea3efb3c84d12b3ef9602.gif)

![Animacja fraktala z łańcuchami kolorowych kół na białym tle](attachment/629353c6d387cf0a728ef67c217a18ff.gif)

![Animacja fraktala z niebieskimi i czarnymi kołami na białym tle](attachment/7011b6d84756d529ed6e48d80403acdd.gif)


## Bibliografia
[^1]: https://hackyeah.pl/tasks-prizes/
[^2]: Treść zadania możecie znaleźć tu: [Details Quantum Art](https://hackyeah.pl/wp-content/uploads/2023/09/DETAILS_QuantumArt_IBM_HackYeah2023.pdf)
[^3]: Artykuł na ten temat: [Creating Fractal Art With Qiskit](https://medium.com/qiskit/creating-fractal-art-with-qiskit-df69427026a0)
[^4]: Zbiory Julii: https://pl.wikipedia.org/wiki/Zbi%C3%B3r_Julii

