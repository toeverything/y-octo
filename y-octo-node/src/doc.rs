use napi::{
    bindgen_prelude::Buffer,
    threadsafe_function::{ErrorStrategy, ThreadsafeFunction, ThreadsafeFunctionCallMode},
    JsFunction,
};
use y_octo::{Doc as YDoc, History};

use super::*;

#[napi]
pub struct Doc {
    doc: YDoc,
}

#[napi]
impl Doc {
    #[napi(constructor)]
    pub fn new(client_id: Option<i64>) -> Self {
        Self {
            doc: if let Some(client_id) = client_id {
                YDoc::with_client(client_id as u64)
            } else {
                YDoc::default()
            },
        }
    }

    #[napi(getter)]
    pub fn client_id(&self) -> i64 {
        self.doc.client() as i64
    }

    #[napi(getter)]
    pub fn guid(&self) -> &str {
        self.doc.guid()
    }

    #[napi(getter)]
    pub fn keys(&self) -> Vec<String> {
        self.doc.keys()
    }

    #[napi]
    pub fn get_or_create_array(&self, key: String) -> Result<YArray> {
        self.doc
            .get_or_create_array(&key)
            .map(YArray::new)
            .map_err(|e| anyhow::Error::from(e))
    }

    #[napi]
    pub fn get_or_create_text(&self, key: String) -> Result<YText> {
        self.doc
            .get_or_create_text(&key)
            .map(YText::new)
            .map_err(|e| anyhow::Error::from(e))
    }

    #[napi]
    pub fn get_or_create_map(&self, key: String) -> Result<YMap> {
        self.doc
            .get_or_create_map(&key)
            .map(YMap::new)
            .map_err(|e| anyhow::Error::from(e))
    }

    #[napi]
    pub fn apply_update(&mut self, update: Buffer) -> Result<Buffer> {
        self.doc
            .apply_update_from_binary(update.to_vec())
            .and_then(|u| u.into_ybinary1().map(|v| v.into()))
            .map_err(|e| anyhow::Error::from(e))
    }

    #[napi]
    pub fn encode_update_v1(&self) -> Result<Buffer> {
        self.doc
            .encode_update_v1()
            .map(|v| v.into())
            .map_err(|e| anyhow::Error::from(e))
    }

    #[napi(ts_args_type = "callback: (result: Uint8Array) => void")]
    pub fn on_update(&mut self, callback: JsFunction) -> Result<()> {
        let tsfn: ThreadsafeFunction<Buffer, ErrorStrategy::Fatal> =
            callback.create_threadsafe_function(0, |ctx| Ok(vec![ctx.value]))?;

        let callback = move |update: &[u8], _h: &[History]| {
            tsfn.call(Buffer::from(update.to_vec()), ThreadsafeFunctionCallMode::Blocking);
        };
        self.doc.subscribe(Box::new(callback));
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_doc_client() {
        let client_id = 1;
        let doc = Doc::new(Some(client_id));
        assert_eq!(doc.client_id(), 1);
    }

    #[test]
    fn test_doc_guid() {
        let doc = Doc::new(None);
        assert_eq!(doc.guid().len(), 21);
    }

    #[test]
    fn test_create_array() {
        let doc = Doc::new(None);
        let array = doc.get_or_create_array("array".into()).unwrap();
        assert_eq!(array.length(), 0);
    }

    #[test]
    fn test_create_text() {
        let doc = Doc::new(None);
        let text = doc.get_or_create_text("text".into()).unwrap();
        assert_eq!(text.len(), 0);
    }

    #[test]
    fn test_keys() {
        let doc = Doc::new(None);
        doc.get_or_create_array("array".into()).unwrap();
        doc.get_or_create_text("text".into()).unwrap();
        doc.get_or_create_map("map".into()).unwrap();
        let mut keys = doc.keys();
        keys.sort();
        assert_eq!(keys, vec!["array", "map", "text"]);
    }
}
