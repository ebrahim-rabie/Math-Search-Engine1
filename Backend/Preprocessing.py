import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer

nltk.download('punkt',      quiet=True)
nltk.download('punkt_tab',  quiet=True)
nltk.download('stopwords',  quiet=True)
nltk.download('wordnet',    quiet=True)

_STOP_WORDS  = set(stopwords.words('english'))
_LEMMATIZER  = WordNetLemmatizer()
_MATH_CHARS  = set("+-=/*^<>{}[]()")


def preprocess_text(text: str) -> list:
    if not isinstance(text, str):
        return []
    tokens = word_tokenize(text.lower())
    tokens = [
        w for w in tokens
        if (w.isalnum() or any(c in _MATH_CHARS for c in w))
        and w not in _STOP_WORDS
    ]
    return [_LEMMATIZER.lemmatize(w) for w in tokens]